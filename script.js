(function() {
    // ========== GESTÃO DE BANCA ==========
    let bancaAtual = 0;
    let bancaInicial = 0;
    let historicoMovimentos = [];
    let valorApostaBase = 10;
    
    // ========== SISTEMA DE VOZ ==========
    let voiceEnabled = true;
    let speechSynthesis = window.speechSynthesis;
    let utterance = null;
    
    function falar(mensagem) {
        if (!voiceEnabled) return;
        try {
            if (speechSynthesis) {
                speechSynthesis.cancel();
                utterance = new SpeechSynthesisUtterance(mensagem);
                utterance.lang = 'pt-BR';
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                const voices = speechSynthesis.getVoices();
                const vozPt = voices.find(v => v.lang === 'pt-BR' && (v.name.includes('Maria') || v.name.includes('Google')));
                if (vozPt) utterance.voice = vozPt;
                speechSynthesis.speak(utterance);
            }
        } catch(e) { console.log('Erro na voz:', e); }
    }
    
    speechSynthesis.getVoices();
    
    const voiceControl = document.createElement('div');
    voiceControl.className = 'voice-control active';
    voiceControl.innerHTML = '<i class="fas fa-microphone-alt"></i>';
    voiceControl.id = 'voiceControl';
    document.body.appendChild(voiceControl);
    
    voiceControl.addEventListener('click', () => {
        voiceEnabled = !voiceEnabled;
        if (voiceEnabled) {
            voiceControl.classList.add('active');
            falar('Notificações por voz ativadas');
        } else {
            voiceControl.classList.remove('active');
            if (speechSynthesis) speechSynthesis.cancel();
        }
    });
    
    function carregarBancaStorage() {
        try {
            const saved = localStorage.getItem('gestao_banca');
            if(saved) {
                const data = JSON.parse(saved);
                bancaAtual = data.bancaAtual || 0;
                bancaInicial = data.bancaInicial || 0;
                historicoMovimentos = data.historicoMovimentos || [];
            }
        } catch(e) {}
        atualizarDisplayBanca();
    }
    
    function salvarBancaStorage() {
        localStorage.setItem('gestao_banca', JSON.stringify({
            bancaAtual: bancaAtual,
            bancaInicial: bancaInicial,
            historicoMovimentos: historicoMovimentos
        }));
    }
    
    function atualizarDisplayBanca() {
        document.getElementById('bancaAtualDisplay').innerHTML = `R$ ${bancaAtual.toFixed(2)}`;
        const lucro = bancaAtual - bancaInicial;
        document.getElementById('lucroTotal').innerHTML = `${lucro >= 0 ? '+' : ''}R$ ${lucro.toFixed(2)}`;
        const perc = bancaInicial > 0 ? (lucro / bancaInicial * 100) : 0;
        document.getElementById('resultadoTotal').innerHTML = `${perc >= 0 ? '+' : ''}${perc.toFixed(1)}%`;
        document.getElementById('resultadoTotal').style.color = lucro >= 0 ? '#00ff96' : '#ff6666';
        
        const container = document.getElementById('historicoMovimentos');
        if(historicoMovimentos.length === 0) {
            container.innerHTML = 'Nenhum movimento registrado';
        } else {
            container.innerHTML = historicoMovimentos.slice().reverse().slice(0, 20).map(m => 
                `<div class="historico-lucro-item ${m.valor >= 0 ? 'lucro-positivo' : 'lucro-negativo'}">
                    ${m.data} → ${m.valor >= 0 ? '+' : ''}R$ ${m.valor.toFixed(2)} | Saldo: R$ ${m.saldo.toFixed(2)}
                </div>`
            ).join('');
        }
    }
    
    function registrarMovimento(valor, descricao = '') {
        if(isNaN(valor)) return false;
        const novoSaldo = bancaAtual + valor;
        if(novoSaldo < 0) {
            alert('❌ Saldo não pode ficar negativo!');
            return false;
        }
        bancaAtual = novoSaldo;
        historicoMovimentos.push({
            data: new Date().toLocaleString('pt-BR'),
            valor: valor,
            saldo: bancaAtual,
            desc: descricao
        });
        if(historicoMovimentos.length > 100) historicoMovimentos.shift();
        salvarBancaStorage();
        atualizarDisplayBanca();
        return true;
    }
    
    function resetarBanca() {
        const novoInicial = parseFloat(document.getElementById('bancaInicial').value);
        if(!isNaN(novoInicial) && novoInicial >= 0) {
            bancaInicial = novoInicial;
            bancaAtual = novoInicial;
            historicoMovimentos = [];
            salvarBancaStorage();
            atualizarDisplayBanca();
            alert(`✅ Banca resetada para R$ ${bancaAtual.toFixed(2)}`);
        } else {
            alert('⚠️ Digite um valor válido para saldo inicial');
        }
    }

    // ========== SISTEMA PRINCIPAL ==========
    const API_URL = 'https://invictusystem.com.br/blaze/update/update-jonbet-recovery-catalogador.php';
    const WHITE_LOGO_URL = 'https://invictusystem.com.br/blaze/img/white-jb.svg';
    const RED_LOGO_URL = 'https://jonbet.bet.br/images/roulette/green-0.svg';
    const BLACK_LOGO_URL = 'https://blaze.bet.br/images/roulette/black-0.svg';
    
    let historicalResults = [];
    let historicalNumbers = [];
    let historicalTimes = [];
    let historicalIds = new Set();
    let whiteHistory = [];
    let lastWhiteTime = null;
    let whiteCountToday = 0;
    let lastWhiteDate = null;
    let consecutiveLosses = 0;
    let lastCheckHash = '';
    let isProcessing = false;

    let currentSignal = { active: false, cor: null, padrao: null, status: 'AGUARDANDO', forca: 8, martingale: 0, dataCompleta: null };
    let signalsHistory = [];
    let placar = { win_primeira: 0, win_gale1: 0, win_gale2: 0, win_branco: 0, loss: 0, consecutivas: 0, max_consecutivas: 0, sinais_hoje: 0 };

    const PADROES = [
        { pattern: ['black', 'red', 'red'], prediction: 'black', desc: '⬛🟥🟥 = ⬛' },
        { pattern: ['black', 'black', 'red'], prediction: 'black', desc: '⬛⬛🟥 = ⬛' },
        { pattern: ['red', 'red', 'red', 'black'], prediction: 'red', desc: '🟥🟥🟥⬛ = 🟥' },
        { pattern: ['black', 'black', 'black', 'red'], prediction: 'red', desc: '⬛⬛⬛🟥 = 🟥' }
    ];

    let soundEnabled = true;
    let audioCtx = null;

    function playSound() {
        if (!soundEnabled) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
            osc.stop(audioCtx.currentTime + 0.5);
        } catch(e) { console.log('Som:', e); }
    }

    document.getElementById('soundControl')?.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        const icon = document.getElementById('soundIcon');
        if (soundEnabled) {
            icon.className = 'fas fa-volume-up';
            document.getElementById('soundControl').style.border = '2px solid #00ff96';
            playSound();
        } else {
            icon.className = 'fas fa-volume-mute';
            document.getElementById('soundControl').style.border = '2px solid #ffaa00';
        }
    });

    function atualizarHorario() {
        document.getElementById('horaAtual').textContent = new Date().toLocaleTimeString('pt-BR');
    }
    setInterval(atualizarHorario, 1000);
    atualizarHorario();

    function atualizarPlacarDisplay() {
        document.getElementById('placarWinPrimeira').textContent = placar.win_primeira;
        document.getElementById('placarWinGale1').textContent = placar.win_gale1;
        document.getElementById('placarWinGale2').textContent = placar.win_gale2;
        document.getElementById('placarWinBranco').textContent = placar.win_branco;
        document.getElementById('placarLoss').textContent = placar.loss;
        document.getElementById('placarConsecutivas').textContent = placar.consecutivas;
        document.getElementById('placarMaximo').textContent = placar.max_consecutivas;
        document.getElementById('sinaisHoje').textContent = placar.sinais_hoje;
        let total = placar.win_primeira + placar.win_gale1 + placar.win_gale2 + placar.win_branco + placar.loss;
        let wins = placar.win_primeira + placar.win_gale1 + placar.win_gale2 + placar.win_branco;
        document.getElementById('placarAssertividade').textContent = total > 0 ? (wins/total*100).toFixed(1)+'%' : '0%';
    }

    function atualizarContadorBranco() {
        let jogosSemBranco = 0;
        for (let i = 0; i < historicalResults.length; i++) {
            if (historicalResults[i] === 'white') break;
            jogosSemBranco++;
        }
        document.getElementById('contadorBrancoCasas').textContent = jogosSemBranco;
        if (lastWhiteTime) {
            document.getElementById('contadorBrancoMinutos').textContent = Math.floor((new Date() - lastWhiteTime) / 60000);
        }
        document.getElementById('totalBrancosHoje').textContent = whiteCountToday;
        
        if (whiteHistory.length > 0) {
            let html = '';
            whiteHistory.slice(-17).reverse().forEach(time => {
                html += `<div class="branco-card"><img src="${WHITE_LOGO_URL}"><span>${time}</span></div>`;
            });
            document.getElementById('historicoBrancos').innerHTML = html;
        }
    }

    function renderGradeResultados() {
        const container = document.getElementById('resultados-grade');
        container.innerHTML = '';
        if (historicalNumbers.length === 0) {
            container.innerHTML = '<div class="loading">Nenhum resultado</div>';
            return;
        }
        for (let i = 0; i < Math.min(historicalNumbers.length, 600); i++) {
            let wrapper = document.createElement('div');
            wrapper.className = 'resultado-container';
            let div = document.createElement('div');
            div.className = `resultado-quadrado ${historicalResults[i]}`;
            if (historicalResults[i] === 'white') {
                let img = document.createElement('img');
                img.src = WHITE_LOGO_URL;
                div.appendChild(img);
            } else {
                div.textContent = historicalNumbers[i];
            }
            let horaDiv = document.createElement('div');
            horaDiv.className = 'resultado-hora';
            horaDiv.textContent = historicalTimes[i] || '--:--';
            wrapper.appendChild(div);
            wrapper.appendChild(horaDiv);
            container.appendChild(wrapper);
        }
    }

    function renderHistoricoSinais() {
        const container = document.getElementById('historicoSinais');
        if (signalsHistory.length === 0) {
            container.innerHTML = '<div class="loading">Nenhum sinal</div>';
            return;
        }
        let html = '';
        for (let i = signalsHistory.length - 1; i >= 0; i--) {
            const s = signalsHistory[i];
            const isProtection = s.resultado === 'WIN (BRANCO)';
            let resultClass = s.resultado === 'WIN' ? 'resultado-win' : (s.resultado === 'LOSS' ? 'resultado-loss' : 'resultado-win-branco');
            let resultText = s.resultado === 'WIN' ? '✅ WIN' : (s.resultado === 'LOSS' ? '❌ LOSS' : '⚪ WIN (PROTEÇÃO)');
            let corClass = s.cor === 'red' ? 'vermelho' : 'preto';
            let corLogo = s.cor === 'red' ? RED_LOGO_URL : BLACK_LOGO_URL;
            
            if (isProtection) {
                html += `<div class="historico-item protecao-branco-item">
                    <div class="historico-data">📅 ${s.dataCompleta}</div>
                    <div class="historico-resultado">
                        <div class="duas-logos-container">
                            <div class="cor-sinal ${corClass}" style="background-image:url('${corLogo}'); background-color:transparent;"></div>
                            <div class="seta-protecao">→</div>
                            <div class="cor-sinal branco-protecao" style="background-color:transparent;"><img src="${WHITE_LOGO_URL}"></div>
                        </div>
                        <div class="sinal-resultado ${resultClass}">${resultText}</div>
                    </div>
                    <div class="protecao-badge">🛡️ PROTEÇÃO ATIVADA</div>
                </div>`;
            } else {
                html += `<div class="historico-item">
                    <div class="historico-data">📅 ${s.dataCompleta}</div>
                    <div class="historico-resultado">
                        <div class="cor-sinal ${corClass}" style="background-image:url('${corLogo}'); background-color:transparent;"></div>
                        <div class="sinal-resultado ${resultClass}">${resultText}</div>
                    </div>
                </div>`;
            }
        }
        container.innerHTML = html;
    }

    function atualizarSinalAtivo() {
        const container = document.getElementById('sinalContainer');
        const sinalLogo = document.getElementById('sinalLogo');
        const galeStatus = document.getElementById('galeStatus');
        const resultadoDiv = document.getElementById('sinalResultado');
        const resultadoTexto = document.getElementById('resultadoTexto');
        const statusDisplay = document.getElementById('sinalStatusDisplay');
        
        if (currentSignal.active) {
            container.classList.add('sinal-ativo');
            let logoUrl = currentSignal.cor === 'red' ? RED_LOGO_URL : BLACK_LOGO_URL;
            sinalLogo.src = logoUrl;
            
            if (currentSignal.martingale > 0 && currentSignal.status === 'AGUARDANDO') {
                galeStatus.style.display = 'inline-block';
                galeStatus.className = currentSignal.martingale === 1 ? 'gale-status gale-primeira' : 'gale-status gale-segunda';
                galeStatus.textContent = currentSignal.martingale === 1 ? '⚠️ GALE 1 - RECUPERAÇÃO' : '💀 GALE 2 - ÚLTIMA CHANCE';
            } else {
                galeStatus.style.display = 'none';
            }
            
            if (currentSignal.status === 'WIN' || currentSignal.status === 'LOSS') {
                resultadoDiv.style.display = 'block';
                resultadoTexto.textContent = currentSignal.status === 'WIN' ? '✅ WIN' : '❌ LOSS';
                resultadoTexto.className = `sinal-resultado ${currentSignal.status === 'WIN' ? 'resultado-win' : 'resultado-loss'}`;
                statusDisplay.textContent = 'FINALIZADO';
            } else {
                resultadoDiv.style.display = 'none';
                statusDisplay.textContent = 'AGUARDANDO RESULTADO';
            }
        } else {
            container.classList.remove('sinal-ativo');
        }
    }

    function mostrarNotificacao(cor, forca, padrao) {
        playSound();
        const logoUrl = cor === 'red' ? RED_LOGO_URL : BLACK_LOGO_URL;
        const corNome = cor === 'red' ? 'VERMELHO' : 'PRETO';
        falar(`Novo sinal de ${corNome}.`);
        
        const notif = document.createElement('div');
        notif.className = `notificacao-sinal notificacao-${cor}`;
        notif.innerHTML = `
            <div class="notificacao-header"><span class="notificacao-titulo">🎯 NOVO SINAL</span><button class="notificacao-fechar">&times;</button></div>
            <div class="notificacao-conteudo"><img src="${logoUrl}" class="logo-sinal" style="background:transparent;"><div><div class="notificacao-cor ${cor}">${cor === 'red' ? '🔴' : '⚫'} ${corNome}</div></div></div>
            <div class="notificacao-timer"><div class="timer-bar"></div></div>`;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('mostrar'), 10);
        notif.querySelector('.notificacao-fechar').onclick = () => { notif.remove(); };
        setTimeout(() => notif.remove(), 8000);
    }

    function mostrarNotificacaoWin(cor, martingale) {
        let corTexto = cor === 'red' ? 'VERMELHO' : 'PRETO';
        let corIcone = cor === 'red' ? '🔴' : '⚫';
        let logoUrl = cor === 'red' ? RED_LOGO_URL : BLACK_LOGO_URL;
        let galeText = martingale === 0 ? 'Entrada' : (martingale === 1 ? 'Gale 1' : 'Gale 2');
        falar(`Vitória no sinal ${corTexto}. ${galeText} confirmado.`);
        
        const notif = document.createElement('div');
        notif.className = 'notificacao-sinal notificacao-win';
        notif.innerHTML = `<div class="notificacao-header"><span class="notificacao-titulo">✅ VITÓRIA!</span><button class="notificacao-fechar">&times;</button></div><div class="notificacao-conteudo"><img src="${logoUrl}" class="logo-sinal"><div><div class="notificacao-cor ${cor}">${corIcone} ${corTexto}</div><div>${galeText === 'Entrada' ? '✅ 1ª ENTRADA' : (martingale === 1 ? '🔄 GALE 1' : '🔄🔄 GALE 2')}</div><div style="color:#00ff00;">🎉 WIN!</div></div></div><div class="notificacao-timer"><div class="timer-bar"></div></div>`;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('mostrar'), 10);
        notif.querySelector('.notificacao-fechar').onclick = () => notif.remove();
        setTimeout(() => notif.remove(), 5000);
    }

    function mostrarNotificacaoLoss(cor) {
        let corTexto = cor === 'red' ? 'VERMELHO' : 'PRETO';
        let corIcone = cor === 'red' ? '🔴' : '⚫';
        falar(`Perda total no sinal ${corTexto}. Finalizando sequência.`);
        
        const notif = document.createElement('div');
        notif.className = 'notificacao-sinal notificacao-loss';
        notif.innerHTML = `<div class="notificacao-header"><span class="notificacao-titulo">❌ LOSS</span><button class="notificacao-fechar">&times;</button></div><div class="notificacao-conteudo"><div><div class="notificacao-cor ${cor}">${corIcone} ${corTexto}</div><div>💀 GALE 2 PERDIDO</div><div style="color:#ff4444;">❌ LOSS!</div></div></div><div class="notificacao-timer"><div class="timer-bar"></div></div>`;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('mostrar'), 10);
        notif.querySelector('.notificacao-fechar').onclick = () => notif.remove();
        setTimeout(() => notif.remove(), 5000);
    }

    function mostrarNotificacaoProtecao(corSinal) {
        let corTexto = corSinal === 'red' ? 'VERMELHO' : 'PRETO';
        let corIcone = corSinal === 'red' ? '🔴' : '⚫';
        let logoUrl = corSinal === 'red' ? RED_LOGO_URL : BLACK_LOGO_URL;
        falar(`Proteção ativada! Saiu branco no sinal ${corTexto}. Vitória garantida.`);
        
        const notif = document.createElement('div');
        notif.className = 'notificacao-sinal notificacao-protecao-ativa';
        notif.innerHTML = `<div class="notificacao-header"><span class="notificacao-titulo">🛡️ PROTEÇÃO!</span><button class="notificacao-fechar">&times;</button></div><div class="notificacao-conteudo"><div style="display:flex;gap:15px;align-items:center;"><div><img src="${logoUrl}" style="width:50px;"><div>SINAL</div></div><div style="font-size:1.5em;">→</div><div><img src="${WHITE_LOGO_URL}" style="width:50px;"><div>PROTEÇÃO</div></div></div><div style="text-align:center;"><div>${corIcone} SINAL: ${corTexto}</div><div>⚪ RESULTADO: BRANCO</div><div style="color:#00ff00;">✅ WIN!</div></div></div><div class="notificacao-timer"><div class="timer-bar"></div></div>`;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('mostrar'), 10);
        notif.querySelector('.notificacao-fechar').onclick = () => notif.remove();
        setTimeout(() => notif.remove(), 8000);
    }

    function formatarData() {
        const d = new Date();
        return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
    }

    function getBestSignal(results) {
        for (let p of PADROES) {
            if (results.length >= p.pattern.length) {
                let match = true;
                for (let j = 0; j < p.pattern.length; j++) {
                    if (results[j] !== p.pattern[j]) { match = false; break; }
                }
                if (match) {
                    let strength = 8 - Math.min(3, consecutiveLosses);
                    if (strength < 5) strength = 5;
                    return { color: p.prediction, forca: strength, name: p.desc };
                }
            }
        }
        return null;
    }

    async function fetchData() {
        if (isProcessing) return;
        isProcessing = true;
        try {
            const resp = await fetch(API_URL);
            const data = await resp.json();
            const recovery = JSON.parse(data.recovery);
            const newHash = JSON.stringify(recovery.map(r => r.id));
            if (newHash === lastCheckHash) { isProcessing = false; return; }
            lastCheckHash = newHash;
            document.getElementById('statusRobo').textContent = 'ONLINE';
            
            let novos = 0;
            let ultimo = null;
            for (let i = recovery.length - 1; i >= 0; i--) {
                const item = recovery[i];
                if (!historicalIds.has(item.id)) {
                    if (item.color === 'white') {
                        lastWhiteTime = new Date();
                        whiteHistory.push(new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}));
                        if (whiteHistory.length > 17) whiteHistory.shift();
                        let hoje = new Date().toDateString();
                        if (lastWhiteDate !== hoje) { whiteCountToday = 1; lastWhiteDate = hoje; }
                        else whiteCountToday++;
                    }
                    historicalResults.unshift(item.color);
                    historicalNumbers.unshift(item.roll);
                    historicalTimes.unshift(item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--');
                    historicalIds.add(item.id);
                    novos++;
                    ultimo = { cor: item.color };
                }
            }
            
            if (novos > 0) {
                renderGradeResultados();
                atualizarContadorBranco();
                
                if (ultimo && currentSignal.active && currentSignal.status === 'AGUARDANDO') {
                    if (ultimo.cor === 'white') {
                        currentSignal.status = 'WIN';
                        placar.win_branco++;
                        placar.consecutivas++;
                        consecutiveLosses = 0;
                        if (placar.consecutivas > placar.max_consecutivas) placar.max_consecutivas = placar.consecutivas;
                        signalsHistory.push({ cor: currentSignal.cor, dataCompleta: formatarData(), resultado: 'WIN (BRANCO)' });
                        if (signalsHistory.length > 50) signalsHistory.shift();
                        renderHistoricoSinais();
                        mostrarNotificacaoProtecao(currentSignal.cor);
                        registrarMovimento(valorApostaBase, `WIN PROTEÇÃO BRANCO (${currentSignal.cor})`);
                        currentSignal.active = false;
                        atualizarSinalAtivo();
                    } else if (ultimo.cor === currentSignal.cor) {
                        currentSignal.status = 'WIN';
                        if (currentSignal.martingale === 0) placar.win_primeira++;
                        else if (currentSignal.martingale === 1) placar.win_gale1++;
                        else placar.win_gale2++;
                        placar.consecutivas++;
                        consecutiveLosses = 0;
                        if (placar.consecutivas > placar.max_consecutivas) placar.max_consecutivas = placar.consecutivas;
                        signalsHistory.push({ cor: currentSignal.cor, dataCompleta: formatarData(), resultado: 'WIN' });
                        if (signalsHistory.length > 50) signalsHistory.shift();
                        renderHistoricoSinais();
                        mostrarNotificacaoWin(currentSignal.cor, currentSignal.martingale);
                        let valorOperacao = valorApostaBase * (currentSignal.martingale === 0 ? 1 : (currentSignal.martingale === 1 ? 2 : 4));
                        registrarMovimento(valorOperacao, `WIN ${currentSignal.cor.toUpperCase()} ${currentSignal.martingale === 0 ? 'Entrada' : `Gale${currentSignal.martingale}`}`);
                        currentSignal.active = false;
                        atualizarSinalAtivo();
                    } else {
                        if (currentSignal.martingale < 2) {
                            currentSignal.martingale++;
                            if (currentSignal.martingale === 1) {
                                falar(`Atenção! Sinal perdeu. Entrando no Gale 1 para ${currentSignal.cor === 'red' ? 'vermelho' : 'preto'}`);
                            } else {
                                falar(`Última chance! Gale 2 ativado para ${currentSignal.cor === 'red' ? 'vermelho' : 'preto'}`);
                            }
                        } else {
                            currentSignal.status = 'LOSS';
                            placar.loss++;
                            placar.consecutivas = 0;
                            consecutiveLosses++;
                            signalsHistory.push({ cor: currentSignal.cor, dataCompleta: formatarData(), resultado: 'LOSS' });
                            if (signalsHistory.length > 50) signalsHistory.shift();
                            renderHistoricoSinais();
                            mostrarNotificacaoLoss(currentSignal.cor);
                            let valorOperacao = - (valorApostaBase * 4);
                            registrarMovimento(valorOperacao, `LOSS ${currentSignal.cor.toUpperCase()} Gale2`);
                            currentSignal.active = false;
                            atualizarSinalAtivo();
                        }
                    }
                    atualizarPlacarDisplay();
                    atualizarSinalAtivo();
                }
                
                if (!currentSignal.active || currentSignal.status !== 'AGUARDANDO') {
                    const best = getBestSignal(historicalResults);
                    if (best) {
                        currentSignal = {
                            active: true,
                            cor: best.color,
                            padrao: best.name,
                            dataCompleta: formatarData(),
                            martingale: 0,
                            status: 'AGUARDANDO',
                            forca: best.forca
                        };
                        placar.sinais_hoje++;
                        atualizarPlacarDisplay();
                        atualizarSinalAtivo();
                        mostrarNotificacao(best.color, best.forca, best.name);
                    }
                }
            }
        } catch(e) {
            document.getElementById('statusRobo').textContent = 'OFFLINE';
        } finally {
            isProcessing = false;
        }
    }
    
    carregarBancaStorage();
    if(bancaAtual === 0 && bancaInicial === 0) {
        bancaInicial = 100;
        bancaAtual = 100;
        salvarBancaStorage();
        atualizarDisplayBanca();
    }
    
    document.getElementById('btnAbrirBanca').onclick = () => {
        document.getElementById('modalBanca').classList.add('active');
    };
    document.getElementById('fecharModal').onclick = () => {
        document.getElementById('modalBanca').classList.remove('active');
    };
    document.getElementById('btnAdicionarMovimento').onclick = () => {
        let valor = parseFloat(document.getElementById('valorMovimento').value);
        if(!isNaN(valor)) {
            registrarMovimento(valor, 'Manual');
            document.getElementById('valorMovimento').value = '';
        } else {
            alert('Digite um valor válido');
        }
    };
    document.getElementById('btnResetarBanca').onclick = () => {
        if(confirm('Resetar banca e zerar histórico?')) resetarBanca();
    };
    
    fetchData();
    setInterval(fetchData, 30000);
    document.getElementById('btnAtualizar').onclick = () => fetchData();
})();

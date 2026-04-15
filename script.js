// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    const campo = document.getElementById('accessCode');
    const btnBlaze = document.getElementById('btnBlaze');
    const btnJonbet = document.getElementById('btnJonbet');
    const loadingMsg = document.getElementById('loading-message');
    const errorMsg = document.getElementById('error-message');
    const vagasSpan = document.getElementById('vagas-restantes');
    
    // URL da página IA Hacker
    const URL_DESTINO = './ia-hacker/index.html';
    
    // Função que verifica a senha e redireciona
    function verificarEAcessar(plataforma) {
        const senhaDigitada = campo.value.trim();
        
        // Esconde mensagens anteriores
        errorMsg.style.display = 'none';
        errorMsg.style.background = 'rgba(255, 0, 0, 0.2)';
        errorMsg.style.color = '#ff6b6b';
        errorMsg.style.border = '1px solid #ff0000';
        
        // Verifica se digitou algo
        if (senhaDigitada === '') {
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = '❌ Digite o código de acesso!';
            campo.focus();
            return;
        }
        
        // VERIFICA A SENHA
        if (senhaDigitada === 'voa25') {
            // SENHA CORRETA!
            loadingMsg.style.display = 'block';
            errorMsg.style.display = 'none';
            
            // Desabilita botões durante o carregamento
            btnBlaze.disabled = true;
            btnJonbet.disabled = true;
            campo.disabled = true;
            
            // Mostra qual plataforma está acessando
            if (plataforma === 'blaze') {
                loadingMsg.innerHTML = '🔐 Acessando Blaze...';
            } else {
                loadingMsg.innerHTML = '🔐 Acessando Jonbet...';
            }
            
            // Redireciona após 1 segundo
            setTimeout(function() {
                window.location.href = URL_DESTINO;
            }, 1000);
            
        } else {
            // SENHA INCORRETA
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = '❌ Código incorreto! Tente novamente.';
            campo.value = '';
            campo.focus();
        }
    }
    
    // Botão BLAZE
    btnBlaze.addEventListener('click', function(e) {
        e.preventDefault();
        verificarEAcessar('blaze');
    });
    
    // Botão JONBET
    btnJonbet.addEventListener('click', function(e) {
        e.preventDefault();
        verificarEAcessar('jonbet');
    });
    
    // Tecla Enter (abre Blaze por padrão)
    campo.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            verificarEAcessar('blaze');
        }
    });
    
    // Limpa erro quando começa a digitar
    campo.addEventListener('input', function() {
        errorMsg.style.display = 'none';
    });
    
    // Foca no campo automaticamente
    campo.focus();
    
    // Contador de vagas (efeito visual)
    setInterval(function() {
        if (vagasSpan) {
            let vagas = parseInt(vagasSpan.textContent);
            vagas = vagas + Math.floor(Math.random() * 5) - 2;
            if (vagas < 50) vagas = 50;
            if (vagas > 127) vagas = 127;
            vagasSpan.textContent = vagas;
        }
    }, 3000);
    
    // Bloquear clique direito
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
});

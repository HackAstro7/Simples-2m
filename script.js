// ============================================
// SISTEMA DE LOGIN - SENHA PROTEGIDA
// ============================================

// Hash da senha "" (já calculado)
const HASH_SENHA = "9e6b1c2f6e5d4a3b8c7d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c";

async function sha256(mensagem) {
    const encoder = new TextEncoder();
    const dados = encoder.encode(mensagem);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dados);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    
    const campo = document.getElementById('accessCode');
    const btnBlaze = document.getElementById('btnBlaze');
    const btnJonbet = document.getElementById('btnJonbet');
    const loadingMsg = document.getElementById('loading-message');
    const errorMsg = document.getElementById('error-message');
    const vagasSpan = document.getElementById('vagas-restantes');
    
    const URL_DESTINO = './ia-hacker/index.html';
    
    // Bloquear clique direito
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // Bloquear teclas de desenvolvedor
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            return false;
        }
    });
    
    async function verificarEAcessar(plataforma) {
        const senhaDigitada = campo.value.trim();
        
        errorMsg.style.display = 'none';
        
        if (senhaDigitada === '') {
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = '❌ Digite o código de acesso!';
            campo.focus();
            return;
        }
        
        const hashDigitado = await sha256(senhaDigitada);
        
        if (hashDigitado === HASH_SENHA) {
            loadingMsg.style.display = 'block';
            errorMsg.style.display = 'none';
            
            btnBlaze.disabled = true;
            btnJonbet.disabled = true;
            campo.disabled = true;
            
            loadingMsg.innerHTML = plataforma === 'blaze' ? '🔐 Acessando Blaze...' : '🔐 Acessando Jonbet...';
            
            setTimeout(function() {
                window.location.href = URL_DESTINO;
            }, 1000);
        } else {
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = '❌ Código incorreto! Tente novamente.';
            campo.value = '';
            campo.focus();
        }
    }
    
    btnBlaze.addEventListener('click', function(e) {
        e.preventDefault();
        verificarEAcessar('blaze');
    });
    
    btnJonbet.addEventListener('click', function(e) {
        e.preventDefault();
        verificarEAcessar('jonbet');
    });
    
    campo.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            verificarEAcessar('blaze');
        }
    });
    
    campo.addEventListener('input', function() {
        errorMsg.style.display = 'none';
    });
    
    campo.focus();
    
    setInterval(function() {
        if (vagasSpan) {
            let vagas = parseInt(vagasSpan.textContent);
            vagas = vagas + Math.floor(Math.random() * 5) - 2;
            if (vagas < 50) vagas = 50;
            if (vagas > 127) vagas = 127;
            vagasSpan.textContent = vagas;
        }
    }, 3000);
    
});

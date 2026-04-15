// ============================================
// SISTEMA DE REDIRECIONAMENTO
// SENHA: voa25
// DESTINO: IA Hacker
// ============================================

const URL_DESTINO = '../ia-hacker/index.html';

document.addEventListener('DOMContentLoaded', function() {
    
    const campo = document.getElementById('accessCode');
    const btnEntrar = document.getElementById('btnEntrar');
    const loadingMsg = document.getElementById('loading-message');
    const errorMsg = document.getElementById('error-message');
    const vagasSpan = document.getElementById('vagas-restantes');
    
    function verificarERedirecionar() {
        const senhaDigitada = campo.value;
        
        errorMsg.style.display = 'none';
        
        if (senhaDigitada === '') {
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = '❌ Digite o código de acesso!';
            campo.focus();
            return;
        }
        
        if (senhaDigitada === 'voa25') {
            loadingMsg.style.display = 'block';
            errorMsg.style.display = 'none';
            btnEntrar.disabled = true;
            campo.disabled = true;
            
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
    
    btnEntrar.addEventListener('click', function(e) {
        e.preventDefault();
        verificarERedirecionar();
    });
    
    campo.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            verificarERedirecionar();
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
    
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
});

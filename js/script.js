document.addEventListener('DOMContentLoaded', async () => {
    console.log('Aerobots Dashboard cargado');

    const cards = document.querySelectorAll('.process-card');

    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    await verificarSesion();

    const btnEditor = document.getElementById('btn-editor');
    const modalLogin = document.getElementById('modal-login');
    const modalClose = document.getElementById('modal-close');
    const formLogin = document.getElementById('form-login');
    const modalMessage = document.getElementById('modal-message');
    const btnLogin = document.getElementById('btn-login');

    btnEditor.addEventListener('click', async (e) => {
        e.preventDefault();

        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            const confirmar = confirm('Ya has iniciado sesion. ¿Deseas cerrar sesion?');
            if (confirmar) {
                await cerrarSesion();
            }
            return;
        }

        modalLogin.classList.add('active');
        modalMessage.textContent = '';
        formLogin.reset();
    });

    modalClose.addEventListener('click', () => {
        modalLogin.classList.remove('active');
    });

    modalLogin.addEventListener('click', (e) => {
        if (e.target === modalLogin) {
            modalLogin.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modalLogin.classList.remove('active');
        }
    });

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        modalMessage.textContent = 'Verificando...';
        modalMessage.style.color = 'var(--text-secondary)';
        btnLogin.disabled = true;
        btnLogin.textContent = 'Entrando...';

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';

        if (error) {
            console.error('Error de login:', error);
            modalMessage.textContent = 'Credenciales incorrectas. Verifica tu correo y contrasena.';
            modalMessage.style.color = 'var(--danger)';
            return;
        }

        modalMessage.textContent = 'Acceso correcto. Redirigiendo...';
        modalMessage.style.color = 'var(--success)';

        setTimeout(() => {
            modalLogin.classList.remove('active');
            verificarSesion();
        }, 1000);
    });
});

async function verificarSesion() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    const userStatus = document.getElementById('user-status');
    const editorTitle = document.getElementById('editor-card-title');
    const editorDesc = document.getElementById('editor-card-desc');
    const editorBadge = document.getElementById('editor-card-badge');

    if (session) {
        const { data: perfil } = await supabaseClient
            .from('perfiles')
            .select('rol')
            .eq('id', session.user.id)
            .single();

        const rol = perfil?.rol || 'viewer';
        const email = session.user.email;

        // Mostrar solo arriba a la derecha
        if (userStatus) {
            userStatus.innerHTML = `<span class="user-email">${email}</span><span class="badge rol-${rol}">${rol}</span>`;
        }

        // Tarjeta de cerrar sesion: sin email, sin badge
        if (editorTitle) editorTitle.textContent = 'Cerrar Sesion';
        if (editorDesc) editorDesc.textContent = 'Finalizar la sesion activa';
        if (editorBadge) editorBadge.style.display = 'none';

        if (rol === 'editor') {
            document.querySelectorAll('.btn-add').forEach(b => b.style.display = 'inline-block');
        }

        console.log('Sesion activa:', email, '- Rol:', rol);
    } else {
        if (userStatus) userStatus.innerHTML = '';

        if (editorTitle) editorTitle.textContent = 'Modo Editor';
        if (editorDesc) editorDesc.textContent = 'Iniciar sesion para editar procesos';
        if (editorBadge) {
            editorBadge.style.display = 'inline-block';
            editorBadge.textContent = 'Acceso restringido';
            editorBadge.className = 'badge editor';
        }

        document.querySelectorAll('.btn-add').forEach(b => b.style.display = 'none');

        console.log('No hay sesion activa');
    }
}

async function cerrarSesion() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Error al cerrar sesion:', error);
        return;
    }
    console.log('Sesion cerrada');
    verificarSesion();
}

function goToProcess(processName) {
    window.location.href = `procesos/${processName}.html`;
}
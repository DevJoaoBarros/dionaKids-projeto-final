// Logótipo do DionaKids: um círculo laranja com o símbolo </> e o nome.
// Usado no menu (Layout) e na tela de login.
function Logo() {
    return (
        <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-laranja flex items-center justify-center">
                {/* aria-hidden: o ícone é só decoração, o nome ao lado já diz tudo*/}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.6"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 6l-6 6 6" />
                    <path d="M16 6l6 6-6 6" />
                </svg>
            </div>
            <span className="font-titulo text-2xl font-extrabold leading-none">
                Diona<span className="text-laranja">kids</span>
            </span>
        </div>
    );
}

export default Logo;
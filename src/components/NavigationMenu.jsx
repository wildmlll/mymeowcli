function NavigationMenu({ setScreen, currentScreen }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 flex justify-around bg-black p-2 safe-area-inset-bottom">
            <button
                onClick={() => setScreen('home')}
                className={`flex-1 py-2 rounded-xl text-center ${
                    currentScreen === 'home' ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gray-700'
                } mx-1 text-sm font-medium`}
            >
                Home
            </button>
            <button
                onClick={() => setScreen('friends')}
                className={`flex-1 py-2 rounded-xl text-center ${
                    currentScreen === 'friends' ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gray-700'
                } mx-1 text-sm font-medium`}
            >
                Friends
            </button>
            <button
                onClick={() => setScreen('profile')}
                className={`flex-1 py-2 rounded-xl text-center ${
                    currentScreen === 'profile' ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gray-700'
                } mx-1 text-sm font-medium`}
            >
                Profile
            </button>
        </div>
    );
}

export default NavigationMenu;
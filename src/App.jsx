import { useState } from 'react';
import AuthHandler from './screens/AuthHandler';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SearchScreen from './screens/SearchScreen';
import NavigationMenu from './components/NavigationMenu';

function App() {
    const [currentScreen, setCurrentScreen] = useState('auth');

    const renderScreen = () => {
        switch (currentScreen) {
            case 'auth':
                return <AuthHandler setScreen={setCurrentScreen} />;
            case 'home':
                return <HomeScreen />;
            case 'profile':
                return <ProfileScreen />;
            case 'search':
                return <SearchScreen />;
            default:
                return <AuthHandler setScreen={setCurrentScreen} />;
        }
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-black">
            <div className="flex-grow">
                {renderScreen()}
            </div>
            {currentScreen !== 'auth' && (
                <NavigationMenu setScreen={setCurrentScreen} currentScreen={currentScreen} />
            )}
        </div>
    );
}

export default App;
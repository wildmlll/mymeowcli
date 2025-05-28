import { useState } from 'react';
import AuthHandler from './screens/AuthHandler';
import HomeScreen from './screens/HomeScreen.jsx';
import ProfileScreen from './screens/ProfileScreen';
import FriendsScreen from './screens/FriendsScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import FriendsListScreen from './screens/FriendsListScreen';
import NavigationMenu from './components/NavigationMenu';

function App() {
    const [currentScreen, setCurrentScreen] = useState('auth');
    const [selectedUserId, setSelectedUserId] = useState(null);

    const renderScreen = () => {
        switch (currentScreen) {
            case 'auth':
                return <AuthHandler setScreen={setCurrentScreen} />;
            case 'home':
                return <HomeScreen />;
            case 'profile':
                return <ProfileScreen setScreen={setCurrentScreen} />;
            case 'friends':
                return <FriendsScreen setSelectedUserId={setSelectedUserId} setScreen={setCurrentScreen} />;
            case 'userProfile':
                return <UserProfileScreen userId={selectedUserId} setScreen={setCurrentScreen} />;
            case 'friendsList':
                return <FriendsListScreen setSelectedUserId={setSelectedUserId} setScreen={setCurrentScreen} />;
            default:
                return <AuthHandler setScreen={setCurrentScreen} />;
        }
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-black">
            <div className="flex-grow">
                {renderScreen()}
            </div>
            {currentScreen !== 'auth' && currentScreen !== 'userProfile' && currentScreen !== 'friendsList' && (
                <NavigationMenu setScreen={setCurrentScreen} currentScreen={currentScreen} />
            )}
        </div>
    );
}

export default App;
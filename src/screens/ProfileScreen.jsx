// src/screens/ProfileScreen.jsx
import { useEffect, useState } from 'react';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getCurrentUser, signOut } from '../services/auth';
import { ref, getDownloadURL } from 'firebase/storage';
import LoadingScreen from './LoadingScreen';

function ProfileScreen() {
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [avatarURL, setAvatarURL] = useState('');
    const [nickname, setNickname] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const currentUser = await getCurrentUser();
                if (!currentUser) {
                    throw new Error('User not authenticated');
                }
                setUser(currentUser);

                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setNickname(userDoc.data().nickname || '');
                }

                const q = query(collection(db, 'statuses'), where('ownerId', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);
                setNotes(querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                    };
                }));

                const avatarRef = ref(storage, `avatars/${currentUser.uid}/avatar.jpg`);
                try {
                    const url = await getDownloadURL(avatarRef);
                    setAvatarURL(url);
                } catch (e) {
                    console.log('No avatar yet');
                }
            } catch (err) {
                console.error('Error fetching profile data:', err);
                setError('Failed to load profile. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await signOut();
            window.location.reload();
        } catch (err) {
            console.error('Error logging out:', err);
            setError('Failed to log out. Please try again.');
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black">
                <p className="text-red-500 text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-4 safe-area-inset-top">
            <h1 className="text-4xl font-bold mb-6">Profile</h1>
            {avatarURL && (
                <img src={avatarURL} alt="Avatar" className="w-24 h-24 rounded-full mb-4" />
            )}
            {nickname && (
                <p className="text-xl font-semibold mb-4">{nickname}</p>
            )}
            <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-6 py-2 rounded-lg mb-4"
            >
                Logout
            </button>
            <div className="w-full max-w-md flex-grow">
                {notes.map(note => (
                    <div key={note.id} className="bg-gray-800 p-4 rounded-lg mb-4 text-center">
                        <p>{note.text}</p>
                        <p className="text-sm text-gray-400">
                            {note.createdAt.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProfileScreen;
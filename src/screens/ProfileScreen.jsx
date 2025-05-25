import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="flex flex-col items-center p-4 safe-area-inset-top min-h-screen bg-black">
            <motion.h1
                className="text-4xl font-bold mb-6 text-center"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                memeow <span className="text-blue-400">〜</span>
            </motion.h1>
            <motion.div
                className="w-full max-w-md bg-[#1a1a1a] p-4 rounded-xl border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                {nickname && (
                    <p className="text-xl font-semibold text-center mb-4">@{nickname}</p>
                )}
                <motion.button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-xl w-full font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Logout
                </motion.button>
            </motion.div>
            <div className="w-full max-w-md flex-grow mt-4 max-h-[60vh] overflow-y-auto">
                <AnimatePresence>
                    {notes.length > 0 ? (
                        notes.map(note => (
                            <motion.div
                                key={note.id}
                                className="bg-[#1a1a1a] p-4 rounded-xl mb-4 border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <p className="text-base text-center">{note.text}</p>
                                <p className="text-sm text-gray-400 text-center">
                                    {note.createdAt.toLocaleString()}
                                </p>
                            </motion.div>
                        ))
                    ) : (
                        <motion.p
                            className="text-center text-gray-400 text-base"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            No meows yet
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default ProfileScreen;
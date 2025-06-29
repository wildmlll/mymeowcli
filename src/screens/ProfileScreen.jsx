import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getCurrentUser, signOut } from '../services/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Network } from '@capacitor/network';
import LoadingScreen from './LoadingScreen';
import Note from '../components/Note';

function ProfileScreen({ setScreen }) {
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [avatarURL, setAvatarURL] = useState('');
    const [nickname, setNickname] = useState('');
    const [friendsCount, setFriendsCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const currentUser = await getCurrentUser();
                if (!currentUser) throw new Error('User not authenticated');
                setUser(currentUser);

                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setNickname(userData.nickname || '');
                    setFriendsCount(userData.friends ? userData.friends.length : 0);
                    setAvatarURL(userData.avatarUrl || '');
                }

                const q = query(collection(db, 'statuses'), where('ownerId', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);
                const userNotes = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
                }));
                userNotes.forEach(note => {
                    note.avatarUrl = avatarURL;
                });
                setNotes(userNotes.sort((a, b) => b.createdAt - a.createdAt));
            } catch (err) {
                console.error('Error fetching profile data:', err);
                setError('Failed to load profile. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [avatarURL]);

    const handleLogout = async () => {
        if (showLogoutConfirm) {
            try {
                setIsLoading(true);
                await signOut();
                window.location.reload();
            } catch (err) {
                console.error('Error logging out:', err);
                setError('Failed to log out. Please try again.');
            } finally {
                setIsLoading(false);
            }
        } else {
            setShowLogoutConfirm(true);
            setTimeout(() => setShowLogoutConfirm(false), 3000);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file && file.type.match(/image\/(jpeg|png|heif|heic)/)) {
            try {
                setIsLoading(true);
                const currentUser = await getCurrentUser();
                if (!currentUser) throw new Error('User not authenticated.');

                const networkStatus = await Network.getStatus();
                if (!networkStatus.connected) {
                    throw new Error('No internet connection. Please check your network.');
                }

                const avatarRef = ref(storage, `avatars/${currentUser.uid}/profile.jpg`);
                const fileData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsArrayBuffer(file);
                });
                const blob = new Blob([fileData], { type: file.type });
                await uploadBytes(avatarRef, blob);
                const newAvatarUrl = await getDownloadURL(avatarRef);
                await updateDoc(doc(db, 'users', currentUser.uid), { avatarUrl: newAvatarUrl });
                setAvatarURL(newAvatarUrl);
                setError(null);
            } catch (err) {
                console.error('Error uploading avatar:', err);
                setError(`Failed to upload avatar. ${err.message}. Check Firebase Storage rules or contact support if persistent.`);
            } finally {
                setIsLoading(false);
            }
        } else {
            setError('Please select a valid image file (JPEG, PNG, HEIC, HEIF).');
        }
    };

    const handleImageError = () => {
        console.error('Failed to load avatar image at:', avatarURL);
        setError('Failed to load avatar image. Check storage permissions or URL.');
    };

    if (isLoading) return <LoadingScreen />;
    if (error) return <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black"><p className="text-red-500 text-center">{error}</p></div>;

    return (
        <div className="flex flex-col items-center p-4 safe-area-inset-top min-h-screen bg-black pt-0">
            <motion.div
                className="fixed top-0 left-0 w-full bg-black z-10 pt-16"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                <h1 className="text-4xl font-bold text-center">
                    mymeow <span className="text-blue-400">〜</span>
                </h1>
            </motion.div>
            <div className="flex items-center mb-4 pt-6">
                <label htmlFor="avatar-upload">
                    {avatarURL ? (
                        <img
                            src={avatarURL}
                            alt="Avatar"
                            className="w-20 h-20 rounded-full mr-4 cursor-pointer"
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-600 mr-4 cursor-pointer flex items-center justify-center">
                            <span className="text-white">Upload</span>
                        </div>
                    )}
                </label>
                <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/heif,image/heic"
                    onChange={handleAvatarChange}
                    className="hidden"
                />
                <div>
                    <p className="text-2xl font-semibold"><span className="text-2xl text-gray-400">@</span>{nickname}</p>
                    <p className="text-sm text-gray-400 cursor-pointer" onClick={() => setScreen('friendsList')}>
                        {friendsCount === 1 ? '1 friend' : `${friendsCount} friends`}
                    </p>
                </div>
            </div>
            <motion.button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-1 rounded-xl font-medium mb-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {showLogoutConfirm ? 'Confirm Logout?' : 'Logout'}
            </motion.button>
            <div className="w-[90%] h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 my-4"></div>
            <div className="w-full max-w-md flex-grow max-h-[60vh] overflow-y-auto notesfry">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <AnimatePresence>
                        {notes.length > 0 ? (
                            notes.map(note => (
                                <Note key={note.id} note={note} onNicknameClick={() => {}} />
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
                </motion.div>
            </div>
        </div>
    );
}

export default ProfileScreen;
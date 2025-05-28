import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import LoadingScreen from './LoadingScreen';
import Note from '../components/Note';
import { IoArrowBack } from 'react-icons/io5';

function UserProfileScreen({ userId, setScreen }) {
    const [userData, setUserData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [relationshipStatus, setRelationshipStatus] = useState('none');
    const [notes, setNotes] = useState([]);
    const [friendsCount, setFriendsCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setIsLoading(true);
                const user = await getCurrentUser();
                if (!user) throw new Error('User not authenticated');
                setCurrentUser(user);

                const userDoc = await getDoc(doc(db, 'users', userId));
                if (!userDoc.exists()) throw new Error('User not found');
                const userDataFetched = userDoc.data();
                setUserData(userDataFetched);

                const friends = userDataFetched.friends || [];
                setFriendsCount(friends.length);

                const notesQuery = query(collection(db, 'statuses'), where('ownerId', '==', userId));
                const querySnapshot = await getDocs(notesQuery);
                const userNotes = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
                })).sort((a, b) => b.createdAt - a.createdAt);
                setNotes(userNotes);

                const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
                if (!currentUserDoc.exists()) throw new Error('Current user data not found');
                const currentUserData = currentUserDoc.data();
                if (currentUserData.friends?.includes(userId)) {
                    setRelationshipStatus('friends');
                } else if (currentUserData.friendRequestsSent?.includes(userId)) {
                    setRelationshipStatus('sent');
                } else if (currentUserData.friendRequestsReceived?.includes(userId)) {
                    setRelationshipStatus('received');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(`Failed to load user profile: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, [userId]);

    const sendFriendRequest = async () => {
        try {
            setIsLoading(true);
            await updateDoc(doc(db, 'users', currentUser.uid), {
                friendRequestsSent: arrayUnion(userId),
            });
            await updateDoc(doc(db, 'users', userId), {
                friendRequestsReceived: arrayUnion(currentUser.uid),
            });
            setRelationshipStatus('sent');
        } catch (err) {
            console.error('Error sending friend request:', err);
            setError('Failed to send friend request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const acceptFriendRequest = async () => {
        try {
            setIsLoading(true);
            await updateDoc(doc(db, 'users', currentUser.uid), {
                friends: arrayUnion(userId),
                friendRequestsReceived: arrayRemove(userId),
            });
            await updateDoc(doc(db, 'users', userId), {
                friends: arrayUnion(currentUser.uid),
                friendRequestsSent: arrayRemove(currentUser.uid),
            });
            setRelationshipStatus('friends');
            setFriendsCount(prev => prev + 1);
        } catch (err) {
            console.error('Error accepting friend request:', err);
            setError('Failed to accept friend request. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
                <div className="relative flex items-center justify-center">
                    <IoArrowBack
                        className="text-2xl text-white absolute left-16 top-1/2 transform -translate-y-1/2 cursor-pointer"
                        onClick={() => setScreen('friends')}
                    />
                    <h1 className="text-4xl font-bold text-center">
                        mymeow <span className="text-blue-400">〜</span>
                    </h1>
                </div>
            </motion.div>
            <div className="flex items-center mb-4 pt-6">
                {userData.avatarUrl && <img src={userData.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full mr-4" />}
                <div>
                    <p className="text-2xl font-semibold"><span className="text-2xl text-gray-400">@</span>{userData.nickname}</p>
                    <p className="text-sm text-gray-400 cursor-pointer" onClick={() => setScreen('friends')}>
                        {friendsCount === 1 ? '1 friend' : `${friendsCount} friends`}
                    </p>
                </div>
            </div>
            {relationshipStatus === 'none' && (
                <motion.button
                    onClick={sendFriendRequest}
                    className="bg-gradient-to-r from-blue-500 to-blue-400 text-white px-4 py-1 rounded-xl font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Send Friend Request
                </motion.button>
            )}
            {relationshipStatus === 'sent' && (
                <motion.button
                    className="bg-gray-500 text-white px-4 py-1 rounded-xl font-medium opacity-50 cursor-not-allowed"
                    disabled
                >
                    Request Sent
                </motion.button>
            )}
            {relationshipStatus === 'received' && (
                <motion.button
                    onClick={acceptFriendRequest}
                    className="bg-green-500 text-white px-4 py-1 rounded-xl font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Accept Request
                </motion.button>
            )}
            {relationshipStatus === 'friends' && (
                <motion.button
                    className="bg-green-500 text-white px-4 py-1 rounded-xl font-medium opacity-50 cursor-not-allowed"
                    disabled
                >
                    Friends
                </motion.button>
            )}
            <div className="w-[90%] h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 my-6"></div>
            <div className="w-full max-w-md flex-grow max-h-[60vh] overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
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
                </motion.div>
            </div>
        </div>
    );
}

export default UserProfileScreen;
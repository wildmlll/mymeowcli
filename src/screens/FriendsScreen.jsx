import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import LoadingScreen from './LoadingScreen';

function FriendsScreen({ setSelectedUserId, setScreen }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [requestStatus, setRequestStatus] = useState('none');
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [friendsList, setFriendsList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const user = await getCurrentUser();
                if (!user) throw new Error('User not authenticated');
                setCurrentUser(user);

                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (!userDoc.exists()) throw new Error('User data not found');
                const userData = userDoc.data();

                const requests = userData.friendRequestsReceived || [];
                const requestDetails = await Promise.all(
                    requests.map(async (uid) => {
                        const requesterDoc = await getDoc(doc(db, 'users', uid));
                        return requesterDoc.exists() ? { id: uid, ...requesterDoc.data() } : null;
                    })
                );
                setIncomingRequests(requestDetails.filter(Boolean));

                const friends = userData.friends || [];
                const friendsDetails = await Promise.all(
                    friends.map(async (friendId) => {
                        const friendDoc = await getDoc(doc(db, 'users', friendId));
                        return friendDoc.exists() ? { id: friendId, ...friendDoc.data() } : null;
                    })
                );
                setFriendsList(friendsDetails.filter(Boolean));
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSearch = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setRequestStatus('none');
            const nicknameDoc = await getDoc(doc(db, 'nicknames', searchTerm));
            if (nicknameDoc.exists()) {
                const userId = nicknameDoc.data().uid;
                const userDoc = await getDoc(doc(db, 'users', userId));
                const userData = userDoc.data();

                const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
                const currentUserData = currentUserDoc.data();
                if (userId === currentUser.uid) {
                    setSearchResult(null);
                    setError('You cannot add yourself as a friend.');
                    return;
                }
                if (currentUserData.friends?.includes(userId)) {
                    setRequestStatus('friends');
                } else if (currentUserData.friendRequestsSent?.includes(userId)) {
                    setRequestStatus('sent');
                } else if (currentUserData.friendRequestsReceived?.includes(userId)) {
                    setRequestStatus('received');
                }
                setSearchResult({ id: userId, ...userData });
            } else {
                setSearchResult(null);
            }
        } catch (err) {
            console.error('Error searching for user:', err);
            setError('Failed to search. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const sendFriendRequest = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await updateDoc(doc(db, 'users', currentUser.uid), {
                friendRequestsSent: arrayUnion(searchResult.id),
            });
            await updateDoc(doc(db, 'users', searchResult.id), {
                friendRequestsReceived: arrayUnion(currentUser.uid),
            });
            setRequestStatus('sent');
        } catch (err) {
            console.error('Error sending friend request:', err);
            setError('Failed to send friend request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const acceptFriendRequest = async (requesterId) => {
        try {
            setIsLoading(true);
            setError(null);
            await updateDoc(doc(db, 'users', currentUser.uid), {
                friends: arrayUnion(requesterId),
                friendRequestsReceived: arrayRemove(requesterId),
            });
            await updateDoc(doc(db, 'users', requesterId), {
                friends: arrayUnion(currentUser.uid),
                friendRequestsSent: arrayRemove(currentUser.uid),
            });
            setIncomingRequests(incomingRequests.filter(req => req.id !== requesterId));
            if (searchResult?.id === requesterId) setRequestStatus('friends');
            setFriendsList(prev => [...prev, incomingRequests.find(req => req.id === requesterId)].filter(Boolean));
        } catch (err) {
            console.error('Error accepting friend request:', err);
            setError('Failed to accept friend request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const declineFriendRequest = async (requesterId) => {
        try {
            setIsLoading(true);
            setError(null);
            await updateDoc(doc(db, 'users', currentUser.uid), {
                friendRequestsReceived: arrayRemove(requesterId),
            });
            await updateDoc(doc(db, 'users', requesterId), {
                friendRequestsSent: arrayRemove(currentUser.uid),
            });
            setIncomingRequests(incomingRequests.filter(req => req.id !== requesterId));
            if (searchResult?.id === requesterId) setRequestStatus('none');
        } catch (err) {
            console.error('Error declining friend request:', err);
            setError('Failed to decline friend request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const viewProfile = (userId) => {
        setSelectedUserId(userId);
        setScreen('userProfile');
    };

    if (isLoading) return <LoadingScreen />;
    if (error) return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black">
            <p className="text-red-500 text-center">{error}</p>
        </div>
    );

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
            <motion.div
                className="w-full max-w-md p-4 mb-4 pt-15"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className=" flex items-center gap-2 mb-3">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-white px-4 py-2 rounded-xl text-center border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ width: 'calc(100% - 80px)', marginLeft: '0' }}
                        placeholder="Search by nickname"
                    />
                    <motion.button
                        onClick={handleSearch}
                        className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 py-2 rounded-xl font-medium"
                        style={{ marginRight: '0' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Search
                    </motion.button>
                </div>
                {searchResult && (
                    <motion.div
                        className="border-2 border-blue-500 p-4 rounded-xl shadow-[0_0_10px_rgba(59,130,246,0.5)] mt-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                {searchResult.avatarUrl && (
                                    <img src={searchResult.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full mr-2" />
                                )}
                                <p className="text-base cursor-pointer" onClick={() => viewProfile(searchResult.id)}>
                                    {searchResult.nickname}
                                </p>
                            </div>
                            {requestStatus === 'none' && (
                                <motion.button
                                    onClick={sendFriendRequest}
                                    className="bg-gradient-to-r from-blue-500 to-blue-400 text-white px-4 py-2 rounded-xl font-medium"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Send Friend Request
                                </motion.button>
                            )}
                            {requestStatus === 'sent' && (
                                <motion.button
                                    className="bg-gray-500 text-white px-4 py-2 rounded-xl font-medium opacity-50 cursor-not-allowed"
                                    disabled
                                >
                                    Request Sent
                                </motion.button>
                            )}
                            {requestStatus === 'received' && (
                                <motion.button
                                    onClick={() => acceptFriendRequest(searchResult.id)}
                                    className="bg-green-500 text-white px-4 py-2 rounded-xl font-medium"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Accept Request
                                </motion.button>
                            )}
                            {requestStatus === 'friends' && (
                                <motion.button
                                    className="bg-green-500 text-white px-4 py-2 rounded-xl font-medium opacity-50 cursor-not-allowed"
                                    disabled
                                >
                                    Friends
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}
            </motion.div>
            {incomingRequests.length > 0 && (
                <motion.div
                    className="w-full max-w-md border-2 border-white p-4 rounded-xl shadow-[0_0_10px_rgba(255,255,255,0.3)] mb-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-xl font-bold mb-2">Friend Requests</h2>
                    <AnimatePresence>
                        {incomingRequests.map(request => (
                            <motion.div
                                key={request.id}
                                className="border-2 border-gray-600 p-3 rounded-xl mb-2 flex items-center justify-between"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center">
                                    {request.avatarUrl && (
                                        <img src={request.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full mr-2" />
                                    )}
                                    <p className="text-base cursor-pointer" onClick={() => viewProfile(request.id)}>
                                        {request.nickname}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <motion.button
                                        onClick={() => acceptFriendRequest(request.id)}
                                        className="bg-green-500 text-white px-3 py-1 rounded-xl font-medium"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Accept
                                    </motion.button>
                                    <motion.button
                                        onClick={() => declineFriendRequest(request.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded-xl font-medium"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Decline
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
            {friendsList.length > 0 && (
                <motion.div
                    className="w-full max-w-md border-2 border-white p-4 rounded-xl shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-xl font-bold mb-2">Friends</h2>
                    <AnimatePresence>
                        {friendsList.map(friend => (
                            <motion.div
                                key={friend.id}
                                className="border-2 border-gray-600 p-3 rounded-xl mb-2 flex items-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {friend.avatarUrl && (
                                    <img src={friend.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full mr-2" />
                                )}
                                <p className="text-base cursor-pointer" onClick={() => viewProfile(friend.id)}>
                                    {friend.nickname}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

        </div>
    );
}

export default FriendsScreen;
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import LoadingScreen from './LoadingScreen';

function FriendsScreen({ setSelectedUserId, setScreen }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [requestStatus, setRequestStatus] = useState('none'); // 'none', 'sent', 'received', 'friends'
    const [incomingRequests, setIncomingRequests] = useState([]);
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

                // Fetch incoming friend requests
                const requests = userData.friendRequestsReceived || [];
                const requestDetails = await Promise.all(
                    requests.map(async (uid) => {
                        const requesterDoc = await getDoc(doc(db, 'users', uid));
                        return requesterDoc.exists() ? { id: uid, ...requesterDoc.data() } : null;
                    })
                );
                setIncomingRequests(requestDetails.filter(Boolean));
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

                // Check relationship status
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
            if (searchResult?.id === requesterId) {
                setRequestStatus('friends');
            }
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
            if (searchResult?.id === requesterId) {
                setRequestStatus('none');
            }
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
        <div className="flex flex-col items-center p-4 safe-area-inset-top min-h-screen bg-black">
            <motion.h1
                className="text-4xl font-bold mb-6 text-center"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                memeow <span className="text-blue-400">〜</span>
            </motion.h1>

            {/* Incoming Friend Requests */}
            {incomingRequests.length > 0 && (
                <motion.div
                    className="w-full max-w-md bg-[#1a1a1a] p-4 rounded-xl border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] mb-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-xl font-bold mb-2">Friend Requests</h2>
                    <AnimatePresence>
                        {incomingRequests.map(request => (
                            <motion.div
                                key={request.id}
                                className="bg-[#2a2a2a] p-3 rounded-xl mb-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {request.avatarUrl && (
                                            <img
                                                src={request.avatarUrl}
                                                alt="Avatar"
                                                className="w-8 h-8 rounded-full mr-2"
                                            />
                                        )}
                                        <p
                                            className="text-base cursor-pointer"
                                            onClick={() => viewProfile(request.id)}
                                        >
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
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Search Section */}
            <motion.div
                className="w-full max-w-md bg-[#1a1a1a] p-4 rounded-xl border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-[#1a1a1a] text-white px-4 py-2 Rounding-xl text-center no-resize border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search by nickname"
                    />
                    <motion.button
                        onClick={handleSearch}
                        className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 py-2 rounded-xl font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Search
                    </motion.button>
                </div>
            </motion.div>

            {/* Search Results */}
            <div className="w-full max-w-md flex-grow mt-4 max-h-[60vh] overflow-y-auto">
                <AnimatePresence>
                    {searchResult && (
                        <motion.div
                            className="bg-[#1a1a1a] p-4 rounded-xl border-4 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {searchResult.avatarUrl && (
                                        <img
                                            src={searchResult.avatarUrl}
                                            alt="Avatar"
                                            className="w-8 h-8 rounded-full mr-2"
                                        />
                                    )}
                                    <p
                                        className="text-base cursor-pointer"
                                        onClick={() => viewProfile(searchResult.id)}
                                    >
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
                </AnimatePresence>
            </div>
        </div>
    );
}

export default FriendsScreen;
// src/screens/SearchScreen.jsx
import { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import LoadingScreen from './LoadingScreen';

function SearchScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [requestSent, setRequestSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const nicknameDoc = await getDoc(doc(db, 'nicknames', searchTerm));
            if (nicknameDoc.exists()) {
                const userId = nicknameDoc.data().uid;
                const userDoc = await getDoc(doc(db, 'users', userId));
                setSearchResult({ id: userId, ...userDoc.data() });
            } else {
                setSearchResult(null);
            }
            setRequestSent(false);
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
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            await addDoc(collection(db, 'friendRequestsSent'), {
                from: currentUser.uid,
                to: searchResult.id,
                createdAt: new Date(),
            });
            setRequestSent(true);
        } catch (err) {
            console.error('Error sending friend request:', err);
            setError('Failed to send friend request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const addFriend = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            await updateDoc(doc(db, 'users', currentUser.uid), {
                friends: arrayUnion(searchResult.id),
            });
            await updateDoc(doc(db, 'users', searchResult.id), {
                friends: arrayUnion(currentUser.uid),
            });
            setRequestSent(false);
        } catch (err) {
            console.error('Error adding friend:', err);
            setError('Failed to add friend. Please try again.');
        } finally {
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
            <h1 className="text-4xl font-bold mb-6">Search</h1>
            <div className="w-full max-w-md flex-grow">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg mb-4 w-full text-center no-resize"
                    placeholder="Search by nickname"
                />
                <button
                    onClick={handleSearch}
                    className="bg-gradient-violet text-white px-6 py-2 rounded-lg w-full mb-4"
                >
                    Search
                </button>
                {searchResult && (
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                        <p>{searchResult.nickname}</p>
                        {!requestSent ? (
                            <button
                                onClick={sendFriendRequest}
                                className="bg-gradient-violet text-white px-4 py-2 rounded-lg mt-2"
                            >
                                Send Friend Request
                            </button>
                        ) : (
                            <button
                                onClick={addFriend}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg mt-2"
                            >
                                Request Sent - Add Friend
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchScreen;
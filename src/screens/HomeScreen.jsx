import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import Note from '../components/Note';
import LoadingScreen from './LoadingScreen';

function HomeScreen({ setScreen, setSelectedUserId }) {
    const [notes, setNotes] = useState([]);
    const [user, setUser] = useState(null);
    const [newNote, setNewNote] = useState('');
    const [canPost, setCanPost] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lockoutTime, setLockoutTime] = useState(null);
    const [isInputFocused, setIsInputFocused] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const currentUser = await getCurrentUser();
                if (!currentUser) throw new Error('User not authenticated');
                setUser(currentUser);

                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (!userDoc.exists()) throw new Error('User data not found');
                const userData = userDoc.data();
                const friends = userData?.friends || [];

                if (!Array.isArray(friends)) {
                    throw new Error('Invalid friends list');
                }

                const lastPostTime = userData?.lastPostTime;
                if (lastPostTime) {
                    const lastPostDate = lastPostTime.toDate ? lastPostTime.toDate() : new Date(lastPostTime);
                    const timeDiff = (new Date() - lastPostDate) / (1000 * 60 * 60);
                    setCanPost(timeDiff >= 6);
                    if (timeDiff < 6) {
                        const lockoutEnd = new Date(lastPostDate.getTime() + 6 * 60 * 60 * 1000);
                        setLockoutTime(lockoutEnd);
                    }
                }

                const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
                const userNotesQuery = query(collection(db, 'statuses'), where('ownerId', '==', currentUser.uid), where('createdAt', '>', sixHoursAgo));
                const userNotesSnapshot = await getDocs(userNotesQuery);
                if (!userNotesSnapshot.empty) {
                    const userNote = userNotesSnapshot.docs[0];
                    const data = userNote.data();
                    data.avatarUrl = userData.avatarUrl || '';
                    setNotes(prevNotes => [{ id: userNote.id, ...data, createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt) }, ...prevNotes]);
                }

                if (friends.length > 0) {
                    // Fetch friends' user data to get avatar URLs
                    const friendDocs = await Promise.all(
                        friends.map(async (friendId) => {
                            const friendDoc = await getDoc(doc(db, 'users', friendId));
                            return friendDoc.exists() ? { id: friendId, ...friendDoc.data() } : null;
                        })
                    );
                    const friendDataMap = new Map(friendDocs.filter(Boolean).map(friend => [friend.id, friend.avatarUrl || '']));

                    const friendsNotesQuery = query(collection(db, 'statuses'), where('ownerId', 'in', friends), where('createdAt', '>', sixHoursAgo));
                    const querySnapshot = await getDocs(friendsNotesQuery);
                    const friendsNotes = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date());
                        return {
                            id: doc.id,
                            ...data,
                            createdAt,
                            avatarUrl: friendDataMap.get(data.ownerId) || ''
                        };
                    });
                    setNotes(prevNotes => [...prevNotes, ...friendsNotes].sort((a, b) => b.createdAt - a.createdAt));
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                if (err.code === 'failed-precondition') {
                    setError('Failed to load data due to a missing Firestore index. Please check the browser console for instructions to fix this.');
                } else {
                    setError('Failed to load data. Please check your internet connection or try again later.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePostNote = async () => {
        if (!canPost || !newNote.trim()) return;
        try {
            setIsLoading(true);
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            const note = {
                text: newNote,
                createdAt: new Date(),
                ownerId: user.uid,
                nickname: userData.nickname,
                avatarUrl:

                    userData.avatarUrl || '',
            };
            const docRef = await addDoc(collection(db, 'statuses'), note);
            await setDoc(doc(db, 'users', user.uid), { lastPostTime: new Date() }, { merge: true });
            setNewNote('');
            setCanPost(false);
            setLockoutTime(new Date(Date.now() + 6 * 60 * 60 * 1000));

            setNotes([{ id: docRef.id, ...note, createdAt: new Date() }, ...notes]);
        } catch (err) {
            console.error('Error posting note:', err);
            setError('Failed to post note. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNicknameClick = (ownerId) => {
        if (ownerId === user.uid) setScreen('profile');
        else {
            setSelectedUserId(ownerId);
            setScreen('userProfile');
        }
    };

    const handleFocus = () => setIsInputFocused(true);
    const handleBlur = () => setIsInputFocused(false);

    if (isLoading) return <LoadingScreen />;
    if (error) return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black">
            <p className="text-red-500 text-center">{error}</p>
        </div>
    );

    return (
        <div className="flex flex-col items-center p-4 safe-area-inset-top h-screen bg-black">
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
                className={`w-full max-w-md fixed bottom-${isInputFocused ? '40' : '24'} z-20 pt-5`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <div className="flex items-center gap-2">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className="flex-1 p-2 rounded-xl text-center text-white placeholder-gray-400 bg-transparent border border-gray-600 focus:outline-none"
                        style={{ width: 'calc(100% - 80px)', marginLeft: '0', height: '40px' }}
                        placeholder={canPost ? 'Write a note...' : `New meow in ${Math.ceil((lockoutTime - new Date()) / (1000 * 60 * 60))} hours, ${Math.ceil((lockoutTime - new Date()) / (1000 * 60) % 60)} minutes`}
                        disabled={!canPost}
                        rows="1"
                    />
                    <motion.button
                        onClick={handlePostNote}
                        className={`bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 py-2 rounded-xl font-medium ${!canPost && 'opacity-50 cursor-not-allowed'}`}
                        style={{ marginRight: '0' }}
                        disabled={!canPost}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Meow
                    </motion.button>
                </div>
            </motion.div>
            <div className="w-[90%] h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 ghjk"></div>
            <div className="w-full max-w-md flex-grow max-h-[50vh] overflow-y-auto pt-6">
                <AnimatePresence>
                    {notes.length > 0 ? (
                        notes.map(note => (
                            <Note key={note.id} note={note} onNicknameClick={handleNicknameClick} />
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

export default HomeScreen;
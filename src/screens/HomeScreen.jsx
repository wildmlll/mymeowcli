import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import Note from '../components/Note';
import LoadingScreen from './LoadingScreen';
import Countdown from 'react-countdown';

function HomeScreen() {
    const [notes, setNotes] = useState([]);
    const [user, setUser] = useState(null);
    const [newNote, setNewNote] = useState('');
    const [canPost, setCanPost] = useState(true);
    const [activeNote, setActiveNote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lockoutTime, setLockoutTime] = useState(null);

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
                if (!userDoc.exists()) {
                    throw new Error('User data not found');
                }
                const userData = userDoc.data();
                const friends = userData?.friends || [];
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
                const userNotesQuery = query(
                    collection(db, 'statuses'),
                    where('ownerId', '==', currentUser.uid),
                    where('createdAt', '>', sixHoursAgo)
                );
                const userNotesSnapshot = await getDocs(userNotesQuery);
                if (!userNotesSnapshot.empty) {
                    const userNote = userNotesSnapshot.docs[0];
                    const data = userNote.data();
                    setActiveNote({
                        id: userNote.id,
                        ...data,
                        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                    });
                }

                if (friends.length > 0) {
                    const friendsNotesQuery = query(
                        collection(db, 'statuses'),
                        where('ownerId', 'in', friends),
                        where('createdAt', '>', sixHoursAgo)
                    );
                    const querySnapshot = await getDocs(friendsNotesQuery);
                    setNotes(querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                        };
                    }));
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                if (err.code === 'failed-precondition') {
                    setError('Failed to load data due to a missing Firestore index. Please check the browser console for instructions to fix this.');
                    console.warn('Firestore index missing. To resolve:');
                    console.warn('- Go to the Firebase Console > Firestore Database > Indexes tab.');
                    console.warn('- Create a composite index for the "statuses" collection with:');
                    console.warn('  - Collection ID: statuses');
                    console.warn('  - Fields: ownerId (ascending), createdAt (ascending)');
                    console.warn('  - Query Scope: Collection');
                    console.warn('- After creating the index, refresh the app or wait for the index to build.');
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
            const note = {
                text: newNote,
                createdAt: new Date(),
                ownerId: user.uid,
                nickname: (await getDoc(doc(db, 'users', user.uid))).data().nickname,
            };
            const docRef = await addDoc(collection(db, 'statuses'), note);
            await setDoc(doc(db, 'users', user.uid), { lastPostTime: new Date() }, { merge: true });
            setNewNote('');
            setCanPost(false);
            setLockoutTime(new Date(Date.now() + 6 * 60 * 60 * 1000));

            setActiveNote({
                id: docRef.id,
                ...note,
                createdAt: new Date()
            });
        } catch (err) {
            console.error('Error posting note:', err);
            setError('Failed to post note. Please try again.');
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
                className="w-full max-w-md bg-[#1a1a1a] p-3 rounded-xl border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <div className="flex items-center gap-2">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className={`flex-1 p-2 rounded-xl text-center text-white placeholder-gray-400 ${
                            canPost ? 'bg-[#1a1a1a]' : 'bg-gray-600 opacity-50'
                        } no-resize border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder={canPost ? 'Write a note...' : 'Meow locked for 6 hours'}
                        disabled={!canPost}
                        rows={1}
                    />
                    <motion.button
                        onClick={handlePostNote}
                        className={`bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 py-2 rounded-xl font-medium ${
                            !canPost && 'opacity-50 cursor-not-allowed'
                        }`}
                        disabled={!canPost}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Meow
                    </motion.button>
                </div>
                {!canPost && lockoutTime && (
                    <p className="text-sm text-gray-400 text-center mt-2">
                        <Countdown date={lockoutTime} />
                    </p>
                )}
            </motion.div>
            <div className="w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 my-4"></div>
            <div className="w-full max-w-md flex-grow mt-4 max-h-[60vh] overflow-y-auto">
                <AnimatePresence>
                    {activeNote && (
                        <motion.div
                            className="mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h2 className="text-lg font-semibold text-center mb-2">Your Active Note</h2>
                            <Note note={activeNote} />
                        </motion.div>
                    )}
                    {notes.length > 0 ? (
                        notes.map(note => (
                            <Note key={note.id} note={note} />
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
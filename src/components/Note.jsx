import { motion } from 'framer-motion';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

function Note({ note, onNicknameClick }) {
    const expirationTime = new Date(note.createdAt.getTime() + 6 * 60 * 60 * 1000);
    const timeLeft = (expirationTime - new Date()) / (6 * 60 * 60 * 1000);
    const percentage = Math.max(0, Math.min(100, timeLeft * 100));
    const isExpired = timeLeft <= 0;

    return (
        <motion.div
            className="border-2 border-white rounded-xl p-2 mb-4 flex justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center">
                {note.avatarUrl && (
                    <img src={note.avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full mr-2 border border-white" />
                )}
                <div>
                    <p
                        className="text-sm text-gray-400 cursor-pointer"
                        onClick={() => onNicknameClick(note.ownerId)}
                    >
                        {note.nickname}
                    </p>
                    <p className="text-base">{note.text}</p>
                </div>
            </div>
            <div className="w-6 h-6">
                {isExpired ? (
                    <span className="text-orange-500 text-xs">🔥</span>
                ) : (
                    <CircularProgressbar
                        value={percentage}
                        text={`${Math.floor(timeLeft * 6)}`}
                        styles={{
                            path: { stroke: '#3b82f6' },
                            trail: { stroke: '#1a1a1a' },
                            text: { fill: '#fff', fontSize: '28px' },
                        }}
                    />
                )}
            </div>
        </motion.div>
    );
}

export default Note;
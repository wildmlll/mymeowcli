import { motion } from 'framer-motion';
import Countdown from 'react-countdown';

function Note({ note }) {
    const expirationTime = new Date(note.createdAt.getTime() + 6 * 60 * 60 * 1000);
    return (
        <motion.div
            className="bg-[#1a1a1a] p-4 rounded-xl mb-4 border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <p className="text-base text-center">{note.text}</p>
            <p className="text-sm text-gray-400 text-center">{note.nickname}</p>
            <Countdown date={expirationTime} className="text-sm text-gray-400 text-center" />
        </motion.div>
    );
}

export default Note;
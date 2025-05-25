// src/components/Note.jsx
import Countdown from 'react-countdown';

function Note({ note }) {
    const expirationTime = new Date(note.createdAt.getTime() + 6 * 60 * 60 * 1000);
    return (
        <div className="bg-gray-800 p-4 rounded-lg mb-4 text-center">
            <p className="text-base">{note.text}</p>
            <p className="text-sm text-gray-400">{note.nickname}</p>
            <Countdown date={expirationTime} className="text-sm text-gray-400" />
        </div>
    );
}

export default Note;
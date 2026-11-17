import { useEffect, useState } from 'react';

// Types and deletes each word in turn, with a blinking cursor
export default function Typewriter({ words }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!words.length) return undefined;
    const word = words[i % words.length];
    let t;
    if (!deleting && text === word) {
      t = setTimeout(() => setDeleting(true), 1500);
    } else if (deleting && text === '') {
      setDeleting(false);
      setI((n) => n + 1);
    } else {
      t = setTimeout(
        () => setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)),
        deleting ? 35 : 80
      );
    }
    return () => clearTimeout(t);
  }, [text, deleting, i, words]);

  return (
    <span>
      {text}
      <span className="animate-blink text-neon">▍</span>
    </span>
  );
}

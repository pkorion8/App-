"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50">{pending ? "Investor is evaluating…" : "Answer investor"}</button>;
}

export function AnswerForm({ action, sessionId, ventureId }: { action: (formData: FormData) => void | Promise<void>; sessionId: string; ventureId: string }) {
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceMessage("Voice transcription is not supported in this browser. You can still type your answer.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-CA";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => { setListening(true); setVoiceMessage("Listening… speak as if you are in the meeting."); };
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) transcript += event.results[i][0].transcript;
      if (transcript.trim()) setAnswer(transcript.trim());
    };
    recognition.onerror = () => setVoiceMessage("I could not hear that clearly. Try again or type your answer.");
    recognition.onend = () => { setListening(false); setVoiceMessage("Voice captured as text. Review it, then answer the investor."); };
    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopVoice() {
    recognitionRef.current?.stop?.();
    setListening(false);
  }

  return <form action={action} className="space-y-4">
    <input type="hidden" name="sessionId" value={sessionId} />
    <input type="hidden" name="ventureId" value={ventureId} />

    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={listening ? stopVoice : startVoice} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${listening ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"}`}>
        <span className={`grid h-7 w-7 place-items-center rounded-full ${listening ? "bg-rose-500 text-white" : "bg-slate-950 text-white"}`}>●</span>
        {listening ? "Stop listening" : "Speak my answer"}
      </button>
      <span className="text-xs text-vs-fg-muted">or type below</span>
    </div>

    {voiceMessage && <p className="rounded-lg bg-vs-bg-subtle px-3 py-2 text-xs text-vs-fg-muted" role="status">{voiceMessage}</p>}

    <textarea name="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} required rows={6} placeholder="Answer as you would in a real investor meeting. The investor can challenge weak answers or end the meeting." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 shadow-inner outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />

    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-xl text-xs leading-5 text-vs-fg-muted">Your answer is evaluated for clarity, conduct and unsupported claims. A weak reply does not automatically move the meeting forward.</p>
      <SubmitButton />
    </div>
  </form>;
}

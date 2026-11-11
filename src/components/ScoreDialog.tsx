import { Check, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../store";
import type { Candidate } from "../types";
import { cn } from "../utils";
import { Modal } from "./Ui";

const quickScores = [60, 70, 80, 85, 90, 95];
const quickComments = ["表达清楚", "基础扎实", "项目完整", "逻辑清晰", "兴趣明确", "投入不足"];

export function ScoreDialog({
  candidate,
  onClose,
}: {
  candidate: Candidate | null;
  onClose: () => void;
}) {
  const { updateCandidateScore, notify } = useApp();
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!candidate) return;
    setScore(candidate.score === null ? "" : String(candidate.score));
    setComment(candidate.comment);
    setSaving(false);
  }, [candidate]);

  const save = async () => {
    if (!candidate || saving) return;
    const value = Number(score);
    if (score.trim() === "" || !Number.isFinite(value) || value < 0 || value > 100) {
      notify("评分应为 0 到 100 之间的数字。", "warning");
      return;
    }
    if (comment.trim().length < 4) {
      notify("请写下至少 4 个字的可核对评语。", "warning");
      return;
    }
    setSaving(true);
    const ok = await updateCandidateScore(candidate.id, Math.round(value), comment.trim());
    setSaving(false);
    if (ok) onClose();
  };

  const addComment = (phrase: string) => {
    setComment((current) => {
      const trimmed = current.trim();
      if (!trimmed) return phrase;
      if (trimmed.includes(phrase)) return current;
      const separator = /[。！？；，,.!?]$/.test(trimmed) ? "" : "；";
      return `${trimmed}${separator}${phrase}`;
    });
  };

  const nudge = (delta: number) => {
    const base = score.trim() === "" ? 80 : Number(score);
    if (!Number.isFinite(base)) return;
    setScore(String(Math.min(100, Math.max(0, base + delta))));
  };

  const selected = score.trim() !== "" ? Number(score) : null;

  return (
    <Modal
      open={Boolean(candidate)}
      onClose={onClose}
      title={candidate ? `为 ${candidate.name} 评分` : "面试评分"}
      description={candidate ? `${candidate.studentNo} · ${candidate.major} · ${candidate.interviewAt}` : undefined}
      footer={
        <>
          <span className="score-hint">Ctrl + Enter 保存</span>
          <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
            <Check aria-hidden="true" /> {saving ? "保存中…" : "保存评分"}
          </button>
        </>
      }
    >
      <div
        className="score-dialog"
        onKeyDown={(event) => {
          if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();
            void save();
          }
        }}
      >
        <section className="score-block">
          <div className="score-block-head">
            <span>面试评分</span>
            <small>点选常用分，或直接输入 0-100</small>
          </div>
          <div className="score-line">
            <div className="score-input-wrap">
              <button type="button" className="score-step" onClick={() => nudge(-1)} aria-label="减 1 分">−</button>
              <input
                data-autofocus
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={score}
                onChange={(event) => setScore(event.target.value)}
                placeholder="88"
              />
              <span className="score-unit">分</span>
              <button type="button" className="score-step" onClick={() => nudge(1)} aria-label="加 1 分">+</button>
            </div>
            <div className="score-chips" role="group" aria-label="常用分数">
              {quickScores.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={cn("score-chip", selected === value && "is-active")}
                  aria-pressed={selected === value}
                  onClick={() => setScore(String(value))}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="score-block">
          <div className="score-block-head">
            <span>面试评语</span>
            <small>点选常用评语，可继续追加</small>
          </div>
          <div className="comment-chips">
            {quickComments.map((phrase) => (
              <button key={phrase} type="button" className="comment-chip" onClick={() => addComment(phrase)}>
                <Plus aria-hidden="true" />
                {phrase}
              </button>
            ))}
          </div>
          <textarea
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="记录具体表现、项目细节和关注点。"
          />
        </section>

        <p className="score-rubric">
          <Star aria-hidden="true" />
          <span>学习态度 25% · 逻辑思维 30% · 编程基础 30% · 沟通投入 15%</span>
        </p>
      </div>
    </Modal>
  );
}

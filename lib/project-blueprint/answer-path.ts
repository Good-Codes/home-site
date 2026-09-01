/**
 * Read / write nested answer keys used by the catalogue (e.g. mobileFollowUps.pushNotifications).
 */

import type { ProjectBlueprintAnswers, UnknownChoice } from "./types";

export function getAnswerValue(
  answers: ProjectBlueprintAnswers,
  answerKey: string,
): unknown {
  if (!answerKey.includes(".")) {
    return answers[answerKey as keyof ProjectBlueprintAnswers];
  }
  const parts = answerKey.split(".");
  let cursor: unknown = answers;
  for (const part of parts) {
    if (cursor === null || cursor === undefined || typeof cursor !== "object") {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

export function setAnswerValue(
  answers: ProjectBlueprintAnswers,
  answerKey: string,
  value: unknown,
): ProjectBlueprintAnswers {
  if (!answerKey.includes(".")) {
    return { ...answers, [answerKey]: value } as ProjectBlueprintAnswers;
  }

  const parts = answerKey.split(".");
  const rootKey = parts[0] as keyof ProjectBlueprintAnswers;
  const existing =
    answers[rootKey] && typeof answers[rootKey] === "object"
      ? { ...(answers[rootKey] as Record<string, unknown>) }
      : {};

  let cursor: Record<string, unknown> = existing;
  for (let i = 1; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const next =
      cursor[part] && typeof cursor[part] === "object"
        ? { ...(cursor[part] as Record<string, unknown>) }
        : {};
    cursor[part] = next;
    cursor = next;
  }
  cursor[parts[parts.length - 1]] = value;

  return { ...answers, [rootKey]: existing } as ProjectBlueprintAnswers;
}

export function setUnknownMarker(
  answers: ProjectBlueprintAnswers,
  questionId: string,
  choice: UnknownChoice | null,
): ProjectBlueprintAnswers {
  const unknowns = { ...(answers.unknowns ?? {}) };
  if (!choice) {
    delete unknowns[questionId];
  } else {
    unknowns[questionId] = choice;
  }
  return { ...answers, unknowns };
}

export function clearUnknownMarker(
  answers: ProjectBlueprintAnswers,
  questionId: string,
): ProjectBlueprintAnswers {
  return setUnknownMarker(answers, questionId, null);
}

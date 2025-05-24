import { TMeeting } from "../types";

export function generateSummaryPrompt(meeting: TMeeting) {
  const { name, date, topics, tasks } = meeting;

  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(date));

  const topicsText = topics
    .map((topic, i) => {
      const { card, chats } = topic;
      const likesText = `좋아요 ${card.likes.length}개`;
      const chatText = chats
        .map((chat) => `"${chat.content}" - ${chat.user.name}`)
        .join("\n");
      return `
      ${i + 1}. **${card.title} (${card.category.toUpperCase()})**
       - ${card.content}
       ${chatText}
       - ${likesText}
    `;
    })
    .join("\n\n");

  const tasksText = tasks.map((task) => {
    const { content, user } = task;
    return `- ${content} - ${user.name}`;
  });

  const prompt = `
    다음은 ${name}의 회의 내용입니다. 전체 회의 내용을 요약 및 분석해주세요.

    ---
    회의 일시: ${formattedDate}

    논의 주제와 내용:
    ${topicsText}

    할 일:
    ${tasksText}
    ---

    데이터를 기반으로 다음과 같은 항목을 포함하여 인사이트를 작성해주세요.
    - 회의 중 논의된 핵심 주제 및 중요 결정사항
    - 다수의 참가자가 공감한 내용
    - 대화 중 드러난 문제점, 갈등, 우려 사항
    - 암시적으로 드러난 이슈
    - 향후 다루면 좋을 후속 주제 또는 개선 방향
  `;

  return prompt;
}

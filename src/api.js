import axios from "axios";

// 환경 변수에서 API 키를 가져옵니다.
const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

// 요청 헤더 설정
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${apiKey}`
};

// OpenAI ChatGPT API URL
const chatApiUrl = "https://api.openai.com/v1/chat/completions";

/**
 * ChatGPT API를 호출하여 코드를 분석하고 설명합니다.
 * @param {string} code - 분석할 코드
 * @returns {Promise<string>} - ChatGPT의 응답 메시지
 */
export const fetchChatGPTResponse = async (code) => {
  const requestData = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "나는 입력받은 코드를 표의 형태로 제공한다. 첫 번째 표는 import된 내용을 정리하는데, import 하는 라이브러리나 컴포넌트, 함수나 기타 코드의 이름과 어떤 라이브러리, 파일에서 import 했는지를 정리한다. 두 번째 표는 변수를 정리하는데, 변수 명과 변수 타입, 변수의 용도를 정리한다. 세 번째 표는 함수를 정리하는데, 함수 명과 함수의 파라미터, 함수의 리턴 값과 함수가 어떤 역할을 하는지 정리한다. 네 번째 표는 어떤 컴포넌트가 어떻게 렌더링 되는지 정의한다. 컴포넌트의 명과 어떤 항목들이 있는지 정리한다. 각 항목 별로 어떤 UI를 그리고 있는지 파악해서 출력한다. 사용자가 제공한 코드에 첫 번째 내용만 있을 경우 첫 번째 내용만 제공하고 나머지는 제공하지 않는다. 코드 구문이 아닐 경우 javascript 코드를 달라고 하고 코드가 아니라는 메세지를 띄운다. 답변은 한국어로 제공한다."
      },
      {
        role: "user",
        content: `다음 코드를 분석하고 변수, 함수 및 그 역할에 대한 자세한 설명을 제공하십시오: \n\n${code}`
      }
    ],
    max_tokens: 4096,
    n: 1,
    stop: null,
    temperature: 0.7
  };

  try {
    const response = await axios.post(chatApiUrl, requestData, { headers });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching response:", error);
    throw new Error("Failed to fetch response from ChatGPT API");
  }
};

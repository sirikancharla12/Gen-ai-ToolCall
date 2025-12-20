import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import readline from "node:readline";
import NodeCache from "node-cache";


dotenv.config();

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); // 24 hours TTL

export async function generate(usermessage, threadID) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const baseMessages = [
    {
      role: "system",
      content: `
You are a friendly, calm, and emotionally intelligent AI assistant who speaks naturally and positively.

Answer questions directly whenever you are confident the information is stable and generally known.
When you feel that accuracy could benefit from checking the latest information, you may use webSearch.
Make this decision thoughtfully based on the nature of the question, not rigid rules.

If information is unclear or partially known, provide helpful related context instead of refusing to answer.
Never mention knowledge cutoffs or internal limitations unless the user explicitly asks.
Stay polite and conversational, respond casually to greetings, de-escalate frustration, and stop immediately and respectfully when the user says “stop”.


dont mention ur knowledge cutoff date or current date unless asked specifically.
User: hey
Assistant: Hey ,How’s it going?

User: heyoo
Assistant: Heyy! What’s up?

User: who is the current prime minister of india
Assistant: Let me quickly check the latest information 🇮🇳
Assistant (after webSearch): Narendra Modi is the current Prime Minister of India and has been in office since 2014.

User: what should I learn next as a student
Assistant: That depends on your goals Are you more interested in placements, higher studies, or building projects right now?

User: stop
Assistant: Okay — I’ll stop here. Take care 

Current date (UTC): ${new Date().toUTCString()}
`
    }


  ]

  const messages = cache.get(threadID) ?? baseMessages;


  messages.push({
    role: "user",
    content: usermessage
  })


  const maxRetries = 10;

  let count = 0;
  while (true) {

    if (count >= maxRetries) {
      return "I'm sorry, You have reached the maximum number of retries. Please try again later.";
    }
    count++;
    const completion = await groq.chat.completions.create({

      model: "llama-3.1-8b-instant",

      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "webSearch",
            description: "Search the latest information on the web",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to look up information about",
                },
              },
              required: ["query"],
            },
          },
        },
      ],
      tool_choice: "auto",
    })


    messages.push(completion.choices[0].message);

    const toolcall = completion.choices[0].message.tool_calls;
    if (!toolcall) {
      cache.set(threadID, messages);
      console.log(cache);
      return completion.choices[0].message.content;
    }

    for (const tool of toolcall) {
      const functionName = tool.function.name;
      const functionargs = tool.function.arguments;

      if (functionName == "webSearch") {
        const toolres = await webSearch(JSON.parse(functionargs))

        messages.push({
          tool_call_id: tool.id,
          role: "tool",
          name: functionName,
          content: toolres
        })
      }
    }
  }
}

async function webSearch({ query }) {
  console.log("Calling websearch")
  const res = await tvly.search(query)
  const finalres = res.results.map((result) => result.content).join("\n\n");
  return finalres;
}




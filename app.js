import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import readline from "node:readline";

dotenv.config();

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


async function invokeLLM() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const messages = [
    {
      role: "system",
      content: `You are smart assistant who answers the questions asked.
                You have access to the following tools:
                1.webSearch({query}): {query:String}`
    },

    // { 
    //   role: "user",
    //    content: "iphone 17 launch date" 
    //   }
  ]


  while (true) {
    const question = await new Promise(resolve =>
      rl.question("You : ", resolve)
    );

    if (question === "exit") {
      rl.close();
      break;
    }
    messages.push({
      role: "user",
      content: question
    })


    while (true) {
      //tool calling loop
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


      //  console.log(JSON.stringify(completion.choices[0].message,null,2));

      //push the latest message to messages array i.e goes to the llm conversation history
      messages.push(completion.choices[0].message);

      const toolcall = completion.choices[0].message.tool_calls;
      //LLM keeps on calling the tool until it gets the answer it needs
      if (!toolcall) {
        // if toolcall isnt done , then it gives the answer
        console.log(completion.choices[0].message.content);
        break;
      }

      // toolcall is an array of tool calls i.e it has multiple tool calls
      for (const tool of toolcall) {
        // console.log("tool called ",tool);
        const functionName = tool.function.name;
        const functionargs = tool.function.arguments;

        if (functionName == "webSearch") {
          const toolres = await webSearch(JSON.parse(functionargs))
          // console.log("tool res : ",toolres);

          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: functionName,
            content: toolres
          })
        }
      }
    }
    rl.close();
  }


}
invokeLLM();
//LLM doesn't execute the tool automatically, it tells us what tool to use and what parameters to pass
// so we need to call the tool manually
// if we want to use the tool automatically, we can set tool_choice to auto 
//tool_call is of type function.
async function webSearch({ query }) {
  console.log("Calling websearch")
  const res = await tvly.search(query)
  // console.log("Tavily response : ",res.results[0]);
  const finalres = res.results.map((result) => result.content).join("\n\n");
  // console.log("Final res : ",finalres);
  return finalres;
}




   //temperature controls the creativity of the output higher values means more creative n lesser values makes it more focued
        // temperature: 1,
        // //stops when the am is found ; used when the llm is generating non stop text. 
        // // stop:"am",

        // max_completion_tokens: 100,
        // //used to reduce repetitiveness in output
        // frequency_penalty: 1,
        //used to pose an penalty to new tokens based on whether they appear in the text so far
        // presence_penalty: 1  , 
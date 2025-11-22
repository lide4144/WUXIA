import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Entity, Move } from "../types";

// NOTE: In a real production app, this should be handled securely.
// We assume process.env.API_KEY is available.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const modelName = "gemini-2.5-flash";

// Schema for generating an enemy
const enemySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The name of the martial arts master (Chinese)." },
    title: { type: Type.STRING, description: "A cool wuxia title like '独臂刀' or '白莲教主' (Chinese)." },
    description: { type: Type.STRING, description: "A short visual description of their appearance and weapon (Chinese)." },
    style: { type: Type.STRING, description: "Description of their martial arts style (Chinese)." },
    hp: { type: Type.INTEGER, description: "Health points, between 80 and 140." },
    atk: { type: Type.INTEGER, description: "Attack power, between 12 and 18." },
    def: { type: Type.INTEGER, description: "Defense power, between 3 and 8." }
  },
  required: ["name", "title", "description", "style", "hp", "atk", "def"],
};

export const generateEnemy = async (): Promise<Entity> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Generate a unique, dangerous ancient Chinese martial arts antagonist for a text-based duel. Return the content in Simplified Chinese.",
      config: {
        responseMimeType: "application/json",
        responseSchema: enemySchema,
        temperature: 0.8,
      }
    });

    if (!response.text) throw new Error("No text returned from AI");
    
    const data = JSON.parse(response.text);
    
    return {
      id: `enemy_${Date.now()}`,
      name: data.name,
      title: data.title,
      description: data.description,
      stats: {
        hp: data.hp,
        maxHp: data.hp,
        qi: 50,
        maxQi: 50,
        atk: data.atk,
        def: data.def,
      }
    };
  } catch (error) {
    console.error("Failed to generate enemy:", error);
    // Fallback enemy
    return {
      id: 'fallback_enemy',
      name: '神秘刺客',
      title: '影武者',
      description: '一个从竹林迷雾中现身的蒙面人，杀气腾腾。',
      stats: { hp: 100, maxHp: 100, qi: 50, maxQi: 50, atk: 14, def: 5 }
    };
  }
};

export const narrateTurn = async (
  playerName: string,
  playerMove: Move,
  enemyName: string,
  enemyActionName: string,
  damageToEnemy: number,
  damageToPlayer: number,
  isVictory: boolean,
  isDefeat: boolean
): Promise<string> => {
  const prompt = `
    请用中文写一段简短的、充满武侠氛围的战斗描写（2-3句话）。
    
    情境:
    - 主角: ${playerName} 使用了 "${playerMove.name}"。
    - 敌人: ${enemyName} 使用了 "${enemyActionName}"。
    - 结果: 主角造成了 ${damageToEnemy} 点伤害。敌人造成了 ${damageToPlayer} 点伤害。
    
    ${isVictory ? "重要: 主角击败了敌人，获得了胜利。" : ""}
    ${isDefeat ? "重要: 主角力竭倒下，被击败了。" : ""}
    
    风格: 金庸古龙风格，描写动作、内力（Qi）的碰撞，用词要古风有力。
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        maxOutputTokens: 150,
        temperature: 0.7,
      }
    });
    return response.text || "刀光剑影之间，胜负已分。";
  } catch (error) {
    return `你使用了${playerMove.name}。${enemyName}进行了反击。双方互有攻守。`;
  }
};
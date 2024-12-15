export interface Config{
  bot: {
    statusBotGlobal: boolean,
    statusBotPerClient: {[key: string]: boolean},
  },
  adminNumber: string
  embeds: string[]
}

export interface Contact {
  phone: string;
  name: string;
  relation: string;
}

export interface MessageProps  {
  msg: string,
  timeStamp: string,
  reply: string,
  timeReply: string
}

export interface ConversationProps{
  phone: string,
  name: string,
  message: MessageProps[]
}


export interface HMBProps{
  behavior?: string | null,
  timeStamp?: string,
}

export interface HumanBehaviorProps{
  phone: string,
  name: string,
  message: HMBProps[]
}
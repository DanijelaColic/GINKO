export {
  CHAT_ASSISTANT_MODE,
  CHAT_LAUNCHER_ENABLED,
  CHAT_WHATSAPP_PREFILL,
  CHAT_WHATSAPP_PREFILL_HR,
  CHATBOT_SUGGESTION_IDS,
  getWhatsAppPrefill,
  buildWhatsAppHref,
  type ChatAssistantMode,
  type ChatbotSuggestionId,
} from './chatbot.config';

export { flattenHouseRule, houseRuleAnswer } from './chatbot.answers';

export type { ChatApiResponse } from './chatbot.api';

export { matchGuestQuestion, topicById, type ChatMatch } from './chatbot.match';

export {
  CHAT_DEEP_LINKS,
  TOPIC_DEEP_LINKS,
  deepLinksForTopic,
  type ChatDeepLinkDef,
  type ChatDeepLinkId,
} from './chatbot.links';

export {
  CHATBOT_KNOWLEDGE,
  knowledgeByStatus,
  topicsReadyForBot,
  topicsWithConflicts,
  type KnowledgeSource,
  type KnowledgeStatus,
  type KnowledgeTopic,
} from './chatbot.knowledge';

export {
  CHATBOT_CONSTRAINTS,
  CHATBOT_ESCALATION,
  CHATBOT_RULES,
  chatbotRulesForLocale,
  type ChatbotRule,
  type ChatbotRuleId,
} from './chatbot.rules';

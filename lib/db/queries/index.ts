// Topic queries
export {
  getDetailsByTopic,
  getTopicsWithCounts,
  getTopicById,
  type TopicWithCounts,
  type GetDetailsByTopicOptions,
  type TopicDetail,
  type TopicDetailsResult,
} from './topics';

// Detail link queries
export {
  getDetailWithLinks,
  createDetailLink,
  getLinksForDetail,
  deleteDetailLink,
  type DetailWithLinks,
  type LinkedDetail,
  type LinkType,
  type MatchConfidence,
  type DetailLink,
} from './detail-links';

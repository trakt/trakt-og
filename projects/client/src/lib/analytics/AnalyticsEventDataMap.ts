import { AnalyticsEvent } from './AnalyticsEvent.ts';

// trakt-web's `AnalyticsEventDataMap.ts`, the source of truth, which HAL's
// allowlist copies too. Keep payloads identical so both apps read as one in the
// dashboards. The unions below are web's own types, inlined; events og has no
// screen for keep open strings.
type MediaType = 'movie' | 'show';
type ExtendedMediaType = MediaType | 'episode';
type NoteType = 'favorites' | 'note';
type Theme = 'system' | 'light' | 'dark';
type FilterMode = 'simple' | 'advanced';
type DiscoverMode = MediaType | 'media';
type SearchMode = 'media' | 'people' | MediaType | 'lists';
type SearchResultPosition = '1-3' | '4-10' | '11+';
type RecommendationMode = 'smart' | 'classic';
type RelatedMode = 'personal' | 'standard';
// og adds `gate`: a signed-out member trying a member action, such as rating.
type LoginSource = 'landing-login' | 'landing-get-started' | 'navbar' | 'redirect' | 'gate';
type GifPickerSource = 'comment' | 'review';
type ReportableType = 'comment' | 'movie' | 'show' | 'season' | 'episode' | 'person' | 'list' | 'user';
type ReportError = 'already-reported' | 'rate-limited' | 'unknown';
type ReportReason = string;
type VipFlow = 'new' | 'renew' | 'switch';
type VipUpsellSource = string;
type CtaType = string;
type MediaVideoType = string;
type ShareArrivalOutcome = string;
type FeatureFlag = string;
type OfflineActionEndpoint = string;
type InsightsOpenSource = string;
type InsightsTab = string;
type TodayOpenSource = string;
type TodayCloseReason = string;
type TodayDayKind = string;
type TodayGrouping = string;
type TodayStoryAction = string;
type TodayStoryFrame = { type: string };
type TodayStoryGroup = { type: string };

type SourceType = { source: string };

// The SvelteKit route template (`/movies/[slug]`), never a resolved path. HAL
// cannot tell a template from a real path shaped like one, so a `pathname` here
// would write user slugs into the dataset.
type PageViewType = { route: string };

type ActionType = { action: 'add' | 'remove' };
type RatingType =
  | { action: 'added' | 'changed'; rating: number }
  | {
      action: 'removed';
    };
type FilterType = { id: string; action: 'set' | 'reset'; mode: FilterMode };
type FiltersType = { action: 'save' | 'reset' };
type CheckInType = { type: 'episode' | 'movie'; action: 'start' | 'stop' };
type FollowType = {
  action: 'follow' | 'unfollow' | 'cancel-follow-request';
};
type BlockType = { action: 'block' | 'unblock' };
type ExtrasType = { slug: string; type: MediaVideoType };
// `matched_on` records which rewording resolved the track. It is deliberately
// absent from the UI and reported here instead, so match quality can be
// measured against how often a track actually gets played. Left an open string
// so a tier added upstream arrives as itself rather than as a neighbour.
type SoundtrackType = SourceType & {
  position: number;
  matched_on: string;
};
type CommentType = {
  action: 'post' | 'reply' | 'edit';
  type: 'text' | 'gif' | 'text-and-gif';
};
type ReactionType = {
  action: 'add' | 'remove';
  type: 'comment' | MediaType;
};
type CalendarType = { action: 'reset' | 'next' | 'previous' };
type CalendarFeedType = { action: 'subscribe' | 'copy'; mode: DiscoverMode };
type StreamOnType = SourceType;
type CtaDataType = { type: CtaType };
type DrilldownType = SourceType & {
  type?: string;
  position?: SearchResultPosition;
};
type SearchType = { mode: SearchMode };
type ListCollaboratorType = {
  action: 'add' | 'remove' | 'leave' | 'limit-reached' | 'view-moved';
};
type ReportOpenType = { type: ReportableType };
type ReportType = {
  type: ReportableType;
  reason: ReportReason;
  outcome: 'sent' | ReportError;
};
type SpoilerRevealType = { type: 'episode' | 'movie' | 'show' | 'comment' };
type GifPickerType = {
  action: 'open' | 'category' | 'select';
  source: GifPickerSource;
};
type DeleteAccountType = {
  action: 'start' | 'confirm' | 'complete' | 'fail';
  exportFirst?: 'yes' | 'no';
};
type ShareType = DrilldownType;
type CoverImageType = { type: ExtendedMediaType };
type DiscoverType = SourceType & { mode: DiscoverMode };
type RecommendationModeType = SourceType & { mode: RecommendationMode };
type RelatedModeType = SourceType & { mode: RelatedMode };
type RecommendationWhyType = { reason: 'people' | 'titles' | 'empty' };
type SeasonalFilterType = { id: string; state: 'enabled' | 'disabled' };
type LinkType = SourceType & { target: string };
type BannerDismissType = { id: string; value: string };
type SortType = { sortBy: string; sortHow: string };
type LikeType = { action: 'like' | 'unlike' };
type VipUpsellType = { source: VipUpsellSource };
type VipFunnelType = { source: VipUpsellSource; flow: VipFlow };
type VipCheckoutType = VipFunnelType & { plan: string };
type VipCheckoutFailedType = VipCheckoutType & { error: string };
type VipConfirmFailedType = VipCheckoutType & { error: string };
type VipGateType = { feature: 'notes' | 'live' };
type VipCancelType = {
  reason?: string;
  tenure?: string;
  offer?: string;
  gateway?: string;
};
type ImportInitiatedType = { source: string };
type ImportCompletedType = {
  source: string;
  totalItems: number;
  historyCount: number;
  watchlistCount: number;
  ratingsCount: number;
  successCount: number;
  failedCount: number;
  unresolvedCount: number;
  ambiguousCount: number;
  duration: number;
};
type ImportFailedType = { source: string; error: string };
type ExportCompletedType = {
  duration: number;
  endpointCount: number;
  failedCount: number;
};
type ExportFailedType = { error: string };

type ClearInitiatedType = { source: string };
type ClearCompletedType = {
  source: string;
  totalItems: number;
  successCount: number;
  failedCount: number;
  duration: number;
};
type ClearFailedType = { source: string; error: string };

type TodayOpenType = { source: TodayOpenSource; state: 'unseen' | 'seen' };
type TodayStoryType = { type: TodayStoryGroup['type'] };
type TodayCloseType = {
  reason: TodayCloseReason;
  duration: number;
  frames: number;
  groups: number;
};
type TodayActionType = {
  action: TodayStoryAction;
  frame: TodayStoryFrame['type'];
};
type TodayGroupingType = { grouping: TodayGrouping };
type TodayDayType = { day: TodayDayKind };

type MixtapeOpenType = { source: string; type: MediaType };
type MixtapePickType = {
  source: 'grid' | 'search';
  type: MediaType;
  picks: number;
};
type MixtapeNoFitsType = { type: MediaType; picks: number };
type MixtapeMixType = { type: MediaType; picks: number; fits: number };
type MixtapeResultType = {
  action: 'open' | 'skip' | 'watchlist';
  position: string;
  type: MediaType;
};

type InsightsOpenType = { source: InsightsOpenSource; tab: InsightsTab };
type InsightsTabType = { tab: InsightsTab };
type RecapTabType = { tab: 'recap' | 'story' };

type OnboardingStepType = {
  step: 'intro' | 'import' | 'outro';
  action: 'view' | 'skip' | 'complete';
};

type PlexSettingType = {
  section: 'feeds' | 'libraries';
  setting: string;
  state: 'on' | 'off';
};

type StreamingServiceType = {
  action: 'connect' | 'sync' | 'unlink' | 'undo';
  service?: string;
};

export type AnalyticsEventDataMap = {
  [AnalyticsEvent.PageView]: PageViewType;
  [AnalyticsEvent.EnterLite]: never;
  [AnalyticsEvent.PublicRedirect]: never;
  [AnalyticsEvent.NonVipRedirect]: never;
  [AnalyticsEvent.Cta]: CtaDataType;
  [AnalyticsEvent.DiscoverMode]: DiscoverType;

  [AnalyticsEvent.Theme]: { theme: Theme };
  [AnalyticsEvent.Locale]: { locale: string };
  [AnalyticsEvent.Link]: LinkType;
  [AnalyticsEvent.Filter]: FilterType;
  [AnalyticsEvent.Filters]: FiltersType;
  [AnalyticsEvent.Drilldown]: DrilldownType;
  [AnalyticsEvent.SummaryDrilldown]: DrilldownType;
  [AnalyticsEvent.Search]: SearchType;
  [AnalyticsEvent.Share]: ShareType;
  [AnalyticsEvent.CopyWebhook]: { provider: 'plex' | 'jellyfin' };
  [AnalyticsEvent.ShareArrival]: {
    type: string;
    outcome: ShareArrivalOutcome;
  };

  [AnalyticsEvent.Drop]: { type: MediaType };
  [AnalyticsEvent.Restore]: never;
  [AnalyticsEvent.MarkAsWatched]: ActionType;
  [AnalyticsEvent.Watchlist]: ActionType;
  [AnalyticsEvent.List]: ActionType;
  [AnalyticsEvent.RemoveFromHistory]: never;
  [AnalyticsEvent.React]: ReactionType;
  [AnalyticsEvent.AddComment]: CommentType;
  [AnalyticsEvent.DeleteComment]: never;
  [AnalyticsEvent.Rate]: RatingType;
  [AnalyticsEvent.CheckIn]: CheckInType;
  [AnalyticsEvent.Extras]: ExtrasType;
  [AnalyticsEvent.Trailer]: { slug: string };
  [AnalyticsEvent.Soundtrack]: SoundtrackType;
  [AnalyticsEvent.StreamOn]: StreamOnType;
  [AnalyticsEvent.HideRecommendation]: { type: MediaType };

  [AnalyticsEvent.Settings]: { settings: string };
  [AnalyticsEvent.CoverImage]: CoverImageType;

  [AnalyticsEvent.Follow]: FollowType;
  [AnalyticsEvent.Block]: BlockType;

  [AnalyticsEvent.ListEdit]: never;
  [AnalyticsEvent.ListDelete]: never;
  [AnalyticsEvent.ListCreate]: never;
  [AnalyticsEvent.ListSort]: SortType;
  [AnalyticsEvent.ListLike]: LikeType;

  [AnalyticsEvent.CalendarPeriod]: CalendarType;
  [AnalyticsEvent.CalendarFeed]: CalendarFeedType;

  [AnalyticsEvent.SeasonalFilter]: SeasonalFilterType;

  [AnalyticsEvent.BannerDismiss]: BannerDismissType;

  [AnalyticsEvent.VipUpsell]: VipUpsellType;
  [AnalyticsEvent.VipUpsellImpression]: VipUpsellType;

  [AnalyticsEvent.VipView]: VipFunnelType;
  [AnalyticsEvent.VipUpgrade]: VipCheckoutType;
  [AnalyticsEvent.VipCheckoutFailed]: VipCheckoutFailedType;
  [AnalyticsEvent.VipCheckoutCanceled]: VipCheckoutType;
  [AnalyticsEvent.VipConfirmed]: VipCheckoutType;
  [AnalyticsEvent.VipConfirmFailed]: VipConfirmFailedType;
  [AnalyticsEvent.VipGate]: VipGateType;
  [AnalyticsEvent.VipManage]: never;
  [AnalyticsEvent.VipCancel]: VipCancelType;

  [AnalyticsEvent.SmartListDelete]: never;
  [AnalyticsEvent.SmartListCreate]: never;
  [AnalyticsEvent.SmartListUpdate]: never;

  [AnalyticsEvent.AddNote]: { type: NoteType };
  [AnalyticsEvent.DeleteNote]: { type: NoteType };
  [AnalyticsEvent.EditNote]: { type: NoteType };

  // Data Import
  [AnalyticsEvent.ImportInitiated]: ImportInitiatedType;
  [AnalyticsEvent.ImportCompleted]: ImportCompletedType;
  [AnalyticsEvent.ImportFailed]: ImportFailedType;

  // Data Export
  // No `isVip`: redundant with `user_type`, which rides on every event.
  [AnalyticsEvent.ExportInitiated]: never;
  [AnalyticsEvent.ExportCompleted]: ExportCompletedType;
  [AnalyticsEvent.ExportFailed]: ExportFailedType;

  // Data Clear
  [AnalyticsEvent.ClearInitiated]: ClearInitiatedType;
  [AnalyticsEvent.ClearCompleted]: ClearCompletedType;
  [AnalyticsEvent.ClearFailed]: ClearFailedType;

  // Today
  [AnalyticsEvent.TodayOpen]: TodayOpenType;
  [AnalyticsEvent.TodayStory]: TodayStoryType;
  [AnalyticsEvent.TodayClose]: TodayCloseType;
  [AnalyticsEvent.TodayAction]: TodayActionType;
  [AnalyticsEvent.TodayGrouping]: TodayGroupingType;
  [AnalyticsEvent.TodayDay]: TodayDayType;

  [AnalyticsEvent.MixtapeOpen]: MixtapeOpenType;
  [AnalyticsEvent.MixtapePick]: MixtapePickType;
  [AnalyticsEvent.MixtapeNoFits]: MixtapeNoFitsType;
  [AnalyticsEvent.MixtapeMix]: MixtapeMixType;
  [AnalyticsEvent.MixtapeResult]: MixtapeResultType;

  [AnalyticsEvent.InsightsOpen]: InsightsOpenType;
  [AnalyticsEvent.InsightsTab]: InsightsTabType;

  [AnalyticsEvent.RecapOpen]: never;
  [AnalyticsEvent.RecapTab]: RecapTabType;
  [AnalyticsEvent.RecapReveal]: never;
  [AnalyticsEvent.RecapChapter]: never;

  [AnalyticsEvent.Favorite]: ActionType;
  [AnalyticsEvent.Rewatching]: { action: 'start' | 'stop' };

  [AnalyticsEvent.LoginStart]: { source: LoginSource };
  [AnalyticsEvent.LoginComplete]: never;
  [AnalyticsEvent.LoginFailed]: { error: string };
  [AnalyticsEvent.Logout]: never;

  [AnalyticsEvent.OnboardingStep]: OnboardingStepType;

  [AnalyticsEvent.PlexConnect]: { action: 'start' | 'complete' | 'fail' };
  [AnalyticsEvent.PlexSync]: { action: 'sync-now' | 'retry' };
  [AnalyticsEvent.PlexServer]: { action: 'save' | 'remove' };
  [AnalyticsEvent.PlexSetting]: PlexSettingType;

  [AnalyticsEvent.StreamingService]: StreamingServiceType;

  [AnalyticsEvent.PreviewFeature]: { id: FeatureFlag; state: 'on' | 'off' };

  [AnalyticsEvent.OfflineQueued]: { type: OfflineActionEndpoint };
  [AnalyticsEvent.OfflineReplayed]: {
    type: OfflineActionEndpoint;
    outcome: 'done' | 'failed';
  };

  [AnalyticsEvent.PwaInstall]: { outcome: 'accepted' | 'dismissed' };

  [AnalyticsEvent.RecommendationMode]: RecommendationModeType;
  [AnalyticsEvent.RelatedMode]: RelatedModeType;
  [AnalyticsEvent.RecommendationWhy]: RecommendationWhyType;

  [AnalyticsEvent.ListCollaborator]: ListCollaboratorType;
  [AnalyticsEvent.MuteSharer]: never;
  [AnalyticsEvent.ReportOpen]: ReportOpenType;
  [AnalyticsEvent.Report]: ReportType;
  [AnalyticsEvent.SpoilerReveal]: SpoilerRevealType;
  [AnalyticsEvent.GifPicker]: GifPickerType;
  [AnalyticsEvent.RevokeApp]: never;
  [AnalyticsEvent.DeleteAccount]: DeleteAccountType;
};

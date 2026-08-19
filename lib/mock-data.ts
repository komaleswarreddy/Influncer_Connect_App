// Comprehensive Mock Data for the Affiliate Platform

export const mockRatings = [
  {
    id: 'rating-1',
    participationId: 'part-1',
    campaignId: '1',
    reviewerId: '1',
    ratedEntityId: '1',
    ratingType: 'influencer_to_campaign',
    overallRating: 4.5,
    review:
      'Great campaign! The products are high quality and the guidelines were clear. The commission structure is fair and the support team is responsive.',
    status: 'approved',
    createdAt: '2024-05-20T12:00:00Z',
  },
  {
    id: 'rating-2',
    participationId: 'part-2',
    campaignId: '2',
    reviewerId: '1',
    ratedEntityId: '2',
    ratingType: 'influencer_to_campaign',
    overallRating: 4.0,
    review: 'Good tech products and clear communication. The review process was straightforward.',
    status: 'approved',
    createdAt: '2024-05-25T14:30:00Z',
  },
];

export const mockAdminRatings = [
  {
    id: 'admin-rating-1',
    participationId: 'part-1',
    campaignId: '1',
    reviewerId: 'admin-1',
    ratedEntityId: '1',
    ratingType: 'admin_to_influencer',
    overallRating: 4.8,
    review:
      'Excellent content quality and engagement. The influencer delivered high-quality posts and maintained consistent communication.',
    status: 'approved',
    createdAt: '2024-05-22T10:00:00Z',
  },
  {
    id: 'admin-rating-2',
    participationId: 'part-2',
    campaignId: '2',
    reviewerId: 'admin-1',
    ratedEntityId: '1',
    ratingType: 'admin_to_influencer',
    overallRating: 4.2,
    review: 'Good technical review content. The influencer provided detailed and honest feedback.',
    status: 'approved',
    createdAt: '2024-05-26T11:00:00Z',
  },
];

export const mockInstagramAnalytics = {
  id: 'inst-1',
  influencerId: '1',
  username: '@lifestyle_influencer',
  profilePictureUrl: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=LI',
  followerCount: 125000,
  averageEngagementRate: 8.5,
  malePercentage: 35,
  femalePercentage: 65,
  audienceDemographicsAgeRange: '18-34',
  topAudienceLocation: 'United States',
  isConnected: true,
  createdAt: '2024-05-01T00:00:00Z',
  updatedAt: '2024-05-20T00:00:00Z',
};

export const mockYouTubeAnalytics = {
  id: 'yt-1',
  influencerId: '1',
  username: 'LifestyleVlogs',
  profilePictureUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=YT',
  followerCount: 89000,
  averageEngagementRate: 12.3,
  malePercentage: 45,
  femalePercentage: 55,
  audienceDemographicsAgeRange: '25-44',
  topAudienceLocation: 'United States',
  isConnected: true,
  createdAt: '2024-05-01T00:00:00Z',
  updatedAt: '2024-05-20T00:00:00Z',
};

export const mockTwitterAnalytics = {
  id: 'tw-1',
  influencerId: '1',
  username: '@lifestyle_tweets',
  profilePictureUrl: 'https://via.placeholder.com/150/1DA1F2/FFFFFF?text=TW',
  followerCount: 45000,
  averageEngagementRate: 6.8,
  malePercentage: 40,
  femalePercentage: 60,
  audienceDemographicsAgeRange: '20-39',
  topAudienceLocation: 'United States',
  isConnected: false,
  createdAt: '2024-05-01T00:00:00Z',
  updatedAt: '2024-05-20T00:00:00Z',
};

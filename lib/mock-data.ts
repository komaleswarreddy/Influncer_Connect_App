// Comprehensive Mock Data for the Affiliate Platform

export const mockCampaigns = [
  {
    id: '1',
    name: 'Summer Fashion Collection 2024',
    description: 'Promote our latest summer fashion collection featuring trendy swimwear, beach accessories, and casual wear. Perfect for lifestyle and fashion influencers.',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    status: 'active',
    type: 'product_promotion',
    targetAudienceAgeGroup: '18-35',
    requiredInfluencerNiche: 'fashion',
    basicGuidelines: 'Create authentic content showcasing the summer collection. Include lifestyle shots, beach scenes, and casual daily wear.',
    preferredSocialMedia: 'instagram',
    contentRequirements: [
      {
        type: 'instagram_post',
        count: 5,
        schedule: 'weekly',
        description: 'High-quality lifestyle posts featuring the collection'
      },
      {
        type: 'instagram_story',
        count: 10,
        schedule: 'daily',
        description: 'Behind-the-scenes and try-on stories'
      },
      {
        type: 'tiktok_video',
        count: 3,
        schedule: 'bi-weekly',
        description: 'Trendy dance and fashion videos'
      }
    ],
    commissionRate: 15,
    metrics: {
      totalReach: 125000,
      engagementRate: 8.5,
      conversions: 450,
      revenue: 22500
    },
    targets: {
      totalReach: 100000,
      engagementRate: 7.0,
      conversions: 300,
      revenue: 15000
    },
    tenantId: 'tenant-1',
    tenant: {
      id: 'tenant-1',
      tenantName: 'Fashion Forward',
      domain: 'fashionforward.com',
      subdomain: 'fashion'
    },
    createdAt: '2024-05-15T10:00:00Z',
    updatedAt: '2024-05-20T14:30:00Z'
  },
  {
    id: '2',
    name: 'Tech Gadgets Review Campaign',
    description: 'Review and promote our latest tech gadgets including smartphones, laptops, and smart home devices. Ideal for tech influencers and reviewers.',
    startDate: '2024-06-15',
    endDate: '2024-09-15',
    status: 'active',
    type: 'product_review',
    targetAudienceAgeGroup: '25-45',
    requiredInfluencerNiche: 'technology',
    basicGuidelines: 'Provide honest, detailed reviews of tech products. Include unboxing, features demonstration, and real-world usage scenarios.',
    preferredSocialMedia: 'youtube',
    contentRequirements: [
      {
        type: 'youtube_video',
        count: 3,
        schedule: 'monthly',
        description: 'Detailed product review videos (10-15 minutes)'
      },
      {
        type: 'instagram_post',
        count: 8,
        schedule: 'weekly',
        description: 'Product highlights and feature showcases'
      },
      {
        type: 'tiktok_video',
        count: 5,
        schedule: 'weekly',
        description: 'Quick tips and feature demonstrations'
      }
    ],
    commissionRate: 20,
    metrics: {
      totalReach: 89000,
      engagementRate: 12.3,
      conversions: 320,
      revenue: 19200
    },
    targets: {
      totalReach: 75000,
      engagementRate: 10.0,
      conversions: 250,
      revenue: 15000
    },
    tenantId: 'tenant-2',
    tenant: {
      id: 'tenant-2',
      tenantName: 'TechZone',
      domain: 'techzone.com',
      subdomain: 'tech'
    },
    createdAt: '2024-05-10T09:00:00Z',
    updatedAt: '2024-05-18T16:45:00Z'
  },
  {
    id: '3',
    name: 'Fitness & Wellness Challenge',
    description: 'Join our 30-day fitness challenge promoting healthy lifestyle products, workout equipment, and nutritional supplements.',
    startDate: '2024-07-01',
    endDate: '2024-07-31',
    status: 'upcoming',
    type: 'challenge',
    targetAudienceAgeGroup: '20-40',
    requiredInfluencerNiche: 'fitness',
    basicGuidelines: 'Document your fitness journey, share workout routines, and showcase our fitness products in action.',
    preferredSocialMedia: 'instagram',
    contentRequirements: [
      {
        type: 'instagram_post',
        count: 15,
        schedule: 'daily',
        description: 'Daily workout and progress posts'
      },
      {
        type: 'instagram_story',
        count: 30,
        schedule: 'daily',
        description: 'Workout snippets and meal prep'
      },
      {
        type: 'youtube_video',
        count: 4,
        schedule: 'weekly',
        description: 'Full workout routines and product reviews'
      }
    ],
    commissionRate: 18,
    metrics: {
      totalReach: 67000,
      engagementRate: 9.8,
      conversions: 280,
      revenue: 16800
    },
    targets: {
      totalReach: 50000,
      engagementRate: 8.0,
      conversions: 200,
      revenue: 12000
    },
    tenantId: 'tenant-3',
    tenant: {
      id: 'tenant-3',
      tenantName: 'FitLife',
      domain: 'fitlife.com',
      subdomain: 'fitness'
    },
    createdAt: '2024-05-25T11:30:00Z',
    updatedAt: '2024-05-28T13:15:00Z'
  },
  {
    id: '4',
    name: 'Home & Lifestyle Collection',
    description: 'Showcase our premium home decor, kitchen appliances, and lifestyle products. Perfect for home and lifestyle influencers.',
    startDate: '2024-06-10',
    endDate: '2024-10-10',
    status: 'active',
    type: 'lifestyle',
    targetAudienceAgeGroup: '25-50',
    requiredInfluencerNiche: 'lifestyle',
    basicGuidelines: 'Create cozy, aspirational content featuring our home products in real living spaces.',
    preferredSocialMedia: 'instagram',
    contentRequirements: [
      {
        type: 'instagram_post',
        count: 12,
        schedule: 'weekly',
        description: 'Lifestyle and home decor posts'
      },
      {
        type: 'instagram_story',
        count: 20,
        schedule: 'weekly',
        description: 'Home tours and product demonstrations'
      },
      {
        type: 'pinterest_pin',
        count: 8,
        schedule: 'weekly',
        description: 'Home decor inspiration and styling tips'
      }
    ],
    commissionRate: 12,
    metrics: {
      totalReach: 95000,
      engagementRate: 7.2,
      conversions: 380,
      revenue: 17100
    },
    targets: {
      totalReach: 80000,
      engagementRate: 6.5,
      conversions: 300,
      revenue: 13500
    },
    tenantId: 'tenant-4',
    tenant: {
      id: 'tenant-4',
      tenantName: 'HomeStyle',
      domain: 'homestyle.com',
      subdomain: 'home'
    },
    createdAt: '2024-05-20T08:45:00Z',
    updatedAt: '2024-05-22T15:20:00Z'
  }
];

export const mockParticipations = [
  {
    id: 'part-1',
    campaignId: '1',
    influencerId: '1',
    status: 'active',
    joinedAt: '2024-05-16T10:30:00Z',
    completedAt: null,
    promotionalLinks: ['https://fashionforward.com/summer-collection'],
    promotionalCodes: ['SUMMER20'],
    influencer_signature: 'data:image/png;base64,mock-signature-1'
  },
  {
    id: 'part-2',
    campaignId: '2',
    influencerId: '1',
    status: 'completed',
    joinedAt: '2024-05-12T14:20:00Z',
    completedAt: '2024-05-25T16:00:00Z',
    promotionalLinks: ['https://techzone.com/gadgets'],
    promotionalCodes: ['TECH15'],
    influencer_signature: 'data:image/png;base64,mock-signature-2'
  },
  {
    id: 'part-3',
    campaignId: '3',
    influencerId: '1',
    status: 'pending',
    joinedAt: '2024-05-26T09:15:00Z',
    completedAt: null,
    promotionalLinks: [],
    promotionalCodes: [],
    influencer_signature: null
  }
];

export const mockRatings = [
  {
    id: 'rating-1',
    participationId: 'part-1',
    campaignId: '1',
    reviewerId: '1',
    ratedEntityId: '1',
    ratingType: 'influencer_to_campaign',
    overallRating: 4.5,
    review: 'Great campaign! The products are high quality and the guidelines were clear. The commission structure is fair and the support team is responsive.',
    status: 'approved',
    createdAt: '2024-05-20T12:00:00Z'
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
    createdAt: '2024-05-25T14:30:00Z'
  }
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
    review: 'Excellent content quality and engagement. The influencer delivered high-quality posts and maintained consistent communication.',
    status: 'approved',
    createdAt: '2024-05-22T10:00:00Z'
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
    createdAt: '2024-05-26T11:00:00Z'
  }
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
  updatedAt: '2024-05-20T00:00:00Z'
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
  updatedAt: '2024-05-20T00:00:00Z'
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
  updatedAt: '2024-05-20T00:00:00Z'
};

export const mockDashboardStats = {
  totalCampaigns: 4,
  activeCampaigns: 2,
  completedCampaigns: 1,
  totalEarnings: 38700,
  totalReach: 376000,
  averageEngagement: 9.45,
  monthlyGrowth: 12.5,
  topPerformingCampaign: 'Summer Fashion Collection 2024'
};

export const mockNotifications = [
  {
    id: 'notif-1',
    title: 'Campaign Approved',
    message: 'Your application for "Summer Fashion Collection 2024" has been approved!',
    type: 'success',
    read: false,
    createdAt: '2024-05-16T10:30:00Z'
  },
  {
    id: 'notif-2',
    title: 'Payment Received',
    message: 'Payment of $2,250 has been processed for your recent campaign.',
    type: 'payment',
    read: true,
    createdAt: '2024-05-15T14:20:00Z'
  },
  {
    id: 'notif-3',
    title: 'New Campaign Available',
    message: 'A new fitness challenge campaign is now available for applications.',
    type: 'info',
    read: false,
    createdAt: '2024-05-25T09:15:00Z'
  }
]; 
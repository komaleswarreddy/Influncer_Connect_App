# Contract Feature for Mobile App

## Overview
This document describes the implementation of the contract signing feature in the mobile app, which allows influencers to view and sign campaign contracts directly within the app.

## Features Implemented

### 1. Contract Page (`/influencer/contract`)
- **Location**: `mobile/app/influencer/contract.tsx`
- **Purpose**: Displays campaign contracts and allows influencers to sign them
- **Features**:
  - Contract HTML display using WebView
  - Signature capture functionality
  - Contract acceptance workflow
  - PDF download capability (placeholder)

### 2. Signature Pad Component
- **Location**: `mobile/components/SignaturePad.tsx`
- **Purpose**: Provides signature drawing and capture functionality
- **Features**:
  - Signature drawing area
  - Signature capture using react-native-view-shot
  - Clear signature functionality
  - Placeholder for proper drawing implementation

### 3. Updated Campaign Store
- **Location**: `mobile/store/campaign-store.ts`
- **Changes**:
  - Modified `joinCampaign` to return participation data
  - Added `acceptContract` method for contract acceptance

### 4. Updated Campaigns Page
- **Location**: `mobile/app/influencer/campaigns/index.tsx`
- **Changes**:
  - Added redirect to contract page after joining campaign
  - Added "View & Sign Contract" button for applied campaigns
  - Updated navigation paths

## Navigation Flow

1. **Apply for Campaign**:
   - User clicks "View & Apply" on available campaign
   - Campaign details modal opens
   - User clicks "Join Campaign"
   - Success alert shows with option to "View Contract"
   - User is redirected to contract page

2. **View Applied Campaign Contract**:
   - User goes to "My Campaigns" tab
   - Applied campaigns show "View & Sign Contract" button
   - Clicking button navigates to contract page

3. **Contract Signing**:
   - Contract page loads with HTML content
   - User can draw signature or upload image
   - User accepts contract
   - Redirects back to campaigns page

## File Structure Changes

```
mobile/app/influencer/
├── _layout.tsx (updated - Stack navigation)
├── contract.tsx (new - Contract page)
├── (tabs)/
│   ├── _layout.tsx (new - Tabs navigation)
│   ├── dashboard.tsx (moved)
│   ├── campaigns/
│   │   └── index.tsx (updated)
│   ├── campaign-progress.tsx (moved)
│   ├── account.tsx (moved)
│   └── ratings.tsx (moved)
└── campaigns/
    └── index.tsx (updated)

mobile/components/
└── SignaturePad.tsx (new)

mobile/store/
└── campaign-store.ts (updated)
```

## Dependencies Used

- `react-native-webview`: For displaying contract HTML
- `react-native-view-shot`: For signature capture
- `expo-router`: For navigation

## Implementation Notes

### Signature Functionality
The current signature implementation is a placeholder. For production, consider using:
- `react-native-signature-canvas`: For proper signature drawing
- `expo-image-picker`: For signature image upload

### PDF Generation
PDF download is currently a placeholder. For production, consider:
- Server-side PDF generation
- Client-side PDF libraries like `react-native-html-to-pdf`

### Contract Display
Contracts are displayed using WebView with HTML content from the backend. The HTML includes:
- Company details
- Influencer details
- Campaign information
- Payment details
- Legal compliance terms

## Testing

1. **Apply for Campaign**:
   - Navigate to campaigns
   - Click "View & Apply" on available campaign
   - Join campaign
   - Verify redirect to contract page

2. **View Applied Campaign**:
   - Go to "My Campaigns" tab
   - Find applied campaign
   - Click "View & Sign Contract"
   - Verify contract page loads

3. **Sign Contract**:
   - Draw or upload signature
   - Accept contract
   - Verify redirect back to campaigns

## Future Enhancements

1. **Proper Signature Drawing**: Implement `react-native-signature-canvas`
2. **Image Upload**: Implement `expo-image-picker` for signature upload
3. **PDF Generation**: Add proper PDF generation and download
4. **Offline Support**: Cache contracts for offline viewing
5. **Push Notifications**: Notify users when contracts are ready
6. **Contract History**: Show signed contracts history
7. **Digital Certificate**: Add digital certificate for signed contracts

## Backend Integration

The mobile app integrates with the existing backend endpoints:
- `GET /api/campaigns/contract/:participationId`: Fetch contract HTML
- `GET /api/campaigns/contract/:participationId/admin-signature`: Fetch admin signature
- `POST /api/campaigns/:participationId/accept-contract`: Accept contract with signature
- `POST /api/campaigns/:campaignId/join`: Join campaign (returns participation ID) 
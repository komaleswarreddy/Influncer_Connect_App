import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { PremiumSegmentedControl } from '@/components/ui';
import type { DmAutomationDraft, DmMatchType, DmReplyType } from '@/lib/scheduler-api';
import { appShell, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

const MATCH_OPTIONS: { key: DmMatchType; label: string }[] = [
  { key: 'contains', label: 'Contains' },
  { key: 'exact', label: 'Exact' },
  { key: 'any', label: 'Any' },
];

const REPLY_OPTIONS: { key: DmReplyType; label: string }[] = [
  { key: 'text', label: 'Custom' },
  { key: 'text_with_link', label: 'Text + link' },
  { key: 'ai_generated', label: 'AI replies' },
];

type DmAutomationDraftVariant = 'post' | 'story';

type Props = {
  value: DmAutomationDraft;
  keywordsText: string;
  variant?: DmAutomationDraftVariant;
  onChange: (next: DmAutomationDraft) => void;
  onKeywordsTextChange: (text: string) => void;
};

export function defaultDmAutomationDraft(): DmAutomationDraft {
  return {
    name: '',
    triggerKeywords: [],
    matchType: 'contains',
    replyType: 'text',
    replyMessages: [''],
    replyLink: '',
    replyLinkLabel: '',
    publicCommentReply: '',
    aiContext: '',
  };
}

export function keywordsToText(keywords: string[]): string {
  return keywords.join(', ');
}

export function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export default function DmAutomationDraftForm({
  value,
  keywordsText,
  variant = 'post',
  onChange,
  onKeywordsTextChange,
}: Props) {
  const isStory = variant === 'story';
  const setReplyMessage = (index: number, text: string) => {
    const next = [...value.replyMessages];
    next[index] = text;
    onChange({ ...value, replyMessages: next.length ? next : [''] });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Automation name</Text>
      <TextInput
        style={styles.input}
        value={value.name}
        onChangeText={(name) => onChange({ ...value, name })}
        placeholder={isStory ? 'Story auto DM' : 'Summer reel auto DM'}
        placeholderTextColor={appShell.textMuted}
      />

      <Text style={styles.label}>Keywords</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={keywordsText}
        onChangeText={(text) => {
          onKeywordsTextChange(text);
          onChange({ ...value, triggerKeywords: parseKeywords(text) });
        }}
        placeholder="price, link, info"
        placeholderTextColor={appShell.textMuted}
        multiline
      />

      <Text style={styles.label}>Match type</Text>
      <PremiumSegmentedControl
        segments={MATCH_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
        value={value.matchType}
        onChange={(matchType) => onChange({ ...value, matchType: matchType as DmMatchType })}
      />

      <Text style={styles.label}>Reply type</Text>
      <PremiumSegmentedControl
        segments={REPLY_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
        value={value.replyType}
        onChange={(replyType) => onChange({ ...value, replyType: replyType as DmReplyType })}
      />

      {value.replyType === 'ai_generated' ? (
        <>
          <Text style={styles.label}>AI context</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={value.aiContext || ''}
            onChangeText={(aiContext) => onChange({ ...value, aiContext })}
            placeholder={
              isStory
                ? 'Tell the AI what to say when someone replies to your story'
                : 'Tell the AI what to say when someone comments'
            }
            placeholderTextColor={appShell.textMuted}
            multiline
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>DM reply</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={value.replyMessages[0] || ''}
            onChangeText={(text) => setReplyMessage(0, text)}
            placeholder={
              isStory
                ? 'Thanks for replying! Check your DMs.'
                : 'Thanks for commenting! Check your DMs.'
            }
            placeholderTextColor={appShell.textMuted}
            multiline
          />
          {value.replyType === 'text_with_link' ? (
            <>
              <Text style={styles.label}>Link URL</Text>
              <TextInput
                style={styles.input}
                value={value.replyLink || ''}
                onChangeText={(replyLink) => onChange({ ...value, replyLink })}
                placeholder="https://"
                placeholderTextColor={appShell.textMuted}
                autoCapitalize="none"
              />
              <Text style={styles.label}>Link label</Text>
              <TextInput
                style={styles.input}
                value={value.replyLinkLabel || ''}
                onChangeText={(replyLinkLabel) => onChange({ ...value, replyLinkLabel })}
                placeholder="Shop now"
                placeholderTextColor={appShell.textMuted}
              />
            </>
          ) : null}
        </>
      )}

      {!isStory ? (
        <>
          <Text style={styles.label}>Public comment reply (optional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={value.publicCommentReply || ''}
            onChangeText={(publicCommentReply) => onChange({ ...value, publicCommentReply })}
            placeholder="Sent you a DM!"
            placeholderTextColor={appShell.textMuted}
            multiline
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontFamily: fonts.semiBold, fontSize: 13, color: appShell.textPrimary },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: fonts.regular,
    color: appShell.textPrimary,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
});

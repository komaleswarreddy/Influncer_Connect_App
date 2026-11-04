import { openExternalUrl } from '../../lib/safe-link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { mediaKitShareText } from '@/lib/share-text';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import {
  Glyph,
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabSectionLabel,
  KollabTextField,
  ScrollScreen,
  showKollabConfirm,
  showKollabToast,
} from '@/components/ui';
import { TemplateCard } from '@/components/brandkit/TemplateCard';
import {
  KIT_TEMPLATES,
  mediaKitApi,
  type KitLink,
  type KitTemplate,
  type MediaKit,
  type MediaKitOverview,
  type MediaKitUpdate,
} from '@/lib/media-kit-api';
import { formatInr } from '@/lib/currency';
import { isValidEmail } from '@/lib/invoice-math';
import { font, useKollab } from '@/theme/kollab-tokens';

type Phase = 'intro' | 'template' | 'manage';
type LinkRow = KitLink & { key: string };

let linkSeq = 0;
const newLink = (l?: KitLink): LinkRow => ({
  key: `link-${++linkSeq}`,
  label: l?.label ?? '',
  url: l?.url ?? '',
});

interface Draft {
  template: KitTemplate;
  displayName: string;
  headline: string;
  bio: string;
  contactEmail: string;
  links: LinkRow[];
  showStats: boolean;
  showRates: boolean;
  showScore: boolean;
  showContact: boolean;
  acceptEnquiries: boolean;
  slug: string;
}

const draftFromKit = (kit: MediaKit): Draft => ({
  template: kit.template,
  displayName: kit.displayName ?? '',
  headline: kit.headline ?? '',
  bio: kit.bio ?? '',
  contactEmail: kit.contactEmail ?? '',
  links: kit.featuredLinks.map((l) => newLink(l)),
  showStats: kit.showStats,
  showRates: kit.showRates,
  showScore: kit.showScore,
  showContact: kit.showContact,
  acceptEnquiries: kit.acceptEnquiries,
  slug: kit.slug,
});

/** The exact body a save sends. Used both to submit and to tell whether anything changed. */
const payloadOf = (d: Draft): MediaKitUpdate => ({
  template: d.template,
  displayName: d.displayName.trim(),
  headline: d.headline.trim(),
  bio: d.bio.trim(),
  contactEmail: d.contactEmail.trim(),
  featuredLinks: d.links
    .filter((l) => l.label.trim() || l.url.trim())
    .map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
  showStats: d.showStats,
  showRates: d.showRates,
  showScore: d.showScore,
  showContact: d.showContact,
  acceptEnquiries: d.acceptEnquiries,
  slug: d.slug.trim(),
});

const FEATURES: {
  icon: React.ComponentProps<typeof Glyph>['name'];
  title: string;
  body: string;
}[] = [
  {
    icon: 'trend',
    title: 'Creator score',
    body: 'Scored from your real Instagram reach, views and engagement.',
  },
  {
    icon: 'tag',
    title: 'Smart price range',
    body: 'Your rates, or an estimate based on your niche, shown to brands.',
  },
  {
    icon: 'doc',
    title: 'One-link media kit',
    body: 'A shareable link brands can open anytime. No PDF, no email attachment.',
  },
  {
    icon: 'store',
    title: 'QR code',
    body: 'Share your kit at events, brand meetups and offline pitches.',
  },
];

export default function BrandKitScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const [overview, setOverview] = useState<MediaKitOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [pickedTemplate, setPickedTemplate] = useState<KitTemplate>('classic');
  const [building, setBuilding] = useState(false);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [writing, setWriting] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [slugNote, setSlugNote] = useState<{ ok: boolean; text: string } | null>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const kit = overview?.kit ?? null;

  const load = useCallback(async () => {
    try {
      const res = await mediaKitApi.me();
      setOverview(res);
      setError(null);
      if (res.kit) {
        // Keep unsaved edits when a background refresh lands; only (re)seed the draft on first load or after a save.
        setDraft((prev) => prev ?? draftFromKit(res.kit as MediaKit));
        setPhase((p) => (p === 'intro' || p === 'template' ? 'manage' : p));
      } else {
        setPhase((p) => (p === 'manage' ? 'intro' : p));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your brand kit');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  // QR follows the kit's current link (changes when the link name changes).
  const kitUrl = kit?.url ?? null;
  useEffect(() => {
    if (!kitUrl) {
      setQrSvg(null);
      return;
    }
    let live = true;
    mediaKitApi
      .qr()
      .then((r) => live && setQrSvg(r.svg))
      .catch(() => live && setQrSvg(null));
    return () => {
      live = false;
    };
  }, [kitUrl]);

  useEffect(
    () => () => {
      if (slugTimer.current) clearTimeout(slugTimer.current);
    },
    []
  );

  const dirty = useMemo(() => {
    if (!kit || !draft) return false;
    return JSON.stringify(payloadOf(draft)) !== JSON.stringify(payloadOf(draftFromKit(kit)));
  }, [kit, draft]);

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const onSlugChange = (value: string) => {
    const next = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    patch({ slug: next });
    if (slugTimer.current) clearTimeout(slugTimer.current);
    if (!next || next === kit?.slug) {
      setSlugNote(null);
      return;
    }
    slugTimer.current = setTimeout(() => {
      mediaKitApi
        .slugAvailable(next)
        .then((r) =>
          setSlugNote({
            ok: r.available,
            text: r.available ? 'This link name is available' : (r.reason ?? 'Not available'),
          })
        )
        .catch(() => setSlugNote(null));
    }, 450);
  };

  const build = async () => {
    if (!overview) return;
    setBuilding(true);
    try {
      const res = await mediaKitApi.save({
        template: pickedTemplate,
        displayName: overview.snapshot.identity.name,
      });
      setDraft(draftFromKit(res.kit));
      setOverview({ ...overview, exists: true, kit: res.kit });
      setPhase('manage');
      showKollabToast('Your brand kit is ready. Review it, then publish.');
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not create your kit');
    } finally {
      setBuilding(false);
    }
  };

  const save = async () => {
    if (!draft || !overview) return;
    if (draft.contactEmail.trim() && !isValidEmail(draft.contactEmail)) {
      showKollabToast('Enter a valid contact email');
      return;
    }
    if (draft.showContact && !draft.contactEmail.trim()) {
      showKollabToast('Add a contact email or switch "Show contact" off');
      return;
    }
    setSaving(true);
    try {
      const res = await mediaKitApi.save(payloadOf(draft));
      setOverview({ ...overview, kit: res.kit });
      setDraft(draftFromKit(res.kit));
      setSlugNote(null);
      showKollabToast('Brand kit saved');
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (next: boolean) => {
    if (!kit || !overview) return;
    if (!next) {
      const ok = await showKollabConfirm({
        title: 'Unpublish your kit?',
        message:
          'Anyone opening your link or QR code will see "not available" until you publish again.',
        confirmLabel: 'Unpublish',
        destructive: true,
      });
      if (!ok) return;
    }
    setPublishing(true);
    try {
      const res = await mediaKitApi.save({ isPublished: next });
      setOverview({ ...overview, kit: res.kit });
      showKollabToast(next ? 'Published. Your link is live.' : 'Unpublished');
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not update');
    } finally {
      setPublishing(false);
    }
  };

  const writeWithAi = async () => {
    if (!draft) return;
    if (draft.headline.trim() || draft.bio.trim()) {
      const ok = await showKollabConfirm({
        title: 'Replace your headline and bio?',
        message: 'The suggestion will overwrite what is there now. You can edit it afterwards.',
        confirmLabel: 'Replace',
      });
      if (!ok) return;
    }
    setWriting(true);
    try {
      const s = await mediaKitApi.suggestCopy();
      patch({ headline: s.headline, bio: s.bio });
      showKollabToast(
        s.source === 'llm' ? 'AI suggestion added. Edit it freely.' : 'Draft added. Edit it freely.'
      );
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not write a suggestion');
    } finally {
      setWriting(false);
    }
  };

  const copyLink = async () => {
    if (!kit) return;
    try {
      await Clipboard.setStringAsync(kit.url);
      showKollabToast('Link copied');
    } catch {
      showKollabToast('Could not copy the link');
    }
  };

  const shareLink = async () => {
    if (!kit) return;
    try {
      await Share.share({
        message: mediaKitShareText({ name: kit.displayName, headline: kit.headline, url: kit.url }),
      });
    } catch {
      showKollabToast('Could not open the share sheet');
    }
  };

  const openLink = async () => {
    if (!kit) return;
    try {
      await openExternalUrl(kit.url);
    } catch {
      showKollabToast('Could not open the link');
    }
  };

  const snapshot = overview?.snapshot;

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{
        keyboardShouldPersistTaps: 'handled',
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        ),
      }}
    >
      <KollabScreenHeader
        title="Brand kit"
        subtitle="A professional creator portfolio that wins brand deals"
      />

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      ) : error || !overview || !snapshot ? (
        <KollabEmptyCard
          title="Couldn’t load your brand kit"
          subtitle={error ?? 'Please try again.'}
          ctaLabel="Try again"
          onPress={() => {
            setLoading(true);
            void load();
          }}
          style={{ marginHorizontal: 0 }}
        />
      ) : phase === 'intro' ? (
        <View style={styles.stack}>
          <View style={[styles.hero, { backgroundColor: c.panel }]}>
            <Text style={[styles.heroTag, { color: c.chartreuse }]}>PORTFOLIO CREATOR</Text>
            <Text style={[styles.heroTitle, { color: c.panelInk }]}>
              Your brand kit, built in seconds.
            </Text>
            <Text style={[styles.heroSub, { color: c.panelInk }]}>
              Built from your real profile, stats and rates. Share it as one link or a QR code.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.strong, { color: c.ink }]}>{snapshot.identity.name}</Text>
                <Text style={[styles.muted, { color: c.ink }]}>
                  {[snapshot.identity.niche, snapshot.identity.country]
                    .filter(Boolean)
                    .join(' · ') || 'Creator'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.big, { color: c.ink }]}>
                  {snapshot.stats.followers
                    ? snapshot.stats.followers.toLocaleString('en-IN')
                    : '–'}
                </Text>
                <Text style={[styles.muted, { color: c.ink }]}>Followers</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: c.ink }]}>Everything in your portfolio</Text>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: c.well }]}>
                <Glyph name={f.icon} color={c.violetDeep} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.strong, { color: c.ink }]}>{f.title}</Text>
                <Text style={[styles.muted, { color: c.ink }]}>{f.body}</Text>
              </View>
            </View>
          ))}

          <KollabButton
            label="Select template and build"
            variant="ink"
            onPress={() => setPhase('template')}
          />
          <Text style={[styles.foot, { color: c.ink }]}>Free to set up · Share in 2 minutes</Text>
        </View>
      ) : phase === 'template' ? (
        <View style={styles.stack}>
          <Text style={[styles.sectionTitle, { color: c.ink }]}>Pick a look</Text>
          <Text style={[styles.muted, { color: c.ink }]}>You can switch templates any time.</Text>
          <View style={styles.templateGrid}>
            {KIT_TEMPLATES.map((t) => (
              <TemplateCard
                key={t.key}
                template={t.key}
                label={t.label}
                blurb={t.blurb}
                selected={pickedTemplate === t.key}
                onPress={() => setPickedTemplate(t.key)}
              />
            ))}
          </View>
          <KollabButton
            label="Build my kit"
            variant="ink"
            loading={building}
            onPress={() => void build()}
          />
          <KollabButton label="Back" variant="soft" onPress={() => setPhase('intro')} />
        </View>
      ) : kit && draft ? (
        <View style={styles.stack}>
          {/* Share */}
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.strong, { color: c.ink }]}>
                  {kit.isPublished ? 'Your kit is live' : 'Your kit is not published'}
                </Text>
                <Text style={[styles.muted, { color: c.ink }]}>
                  {kit.isPublished
                    ? `${kit.viewCount} view${kit.viewCount === 1 ? '' : 's'}`
                    : 'Brands can not see it yet'}
                </Text>
              </View>
              {publishing ? (
                <ActivityIndicator color={c.ink} />
              ) : (
                <Switch
                  value={kit.isPublished}
                  onValueChange={(v) => void togglePublish(v)}
                  trackColor={{ false: c.outline, true: c.violet }}
                  thumbColor={c.card}
                  accessibilityLabel="Publish brand kit"
                />
              )}
            </View>
            <Text style={[styles.link, { color: c.violetDeep }]} selectable numberOfLines={2}>
              {kit.url}
            </Text>
            <View style={styles.btnRow}>
              <KollabButton
                label="Copy"
                variant="soft"
                compact
                onPress={() => void copyLink()}
                style={styles.flex}
              />
              <KollabButton
                label="Share"
                variant="soft"
                compact
                onPress={() => void shareLink()}
                style={styles.flex}
              />
              <KollabButton
                label="Open"
                variant="hairline"
                compact
                disabled={!kit.isPublished}
                onPress={() => void openLink()}
                style={styles.flex}
              />
            </View>
            {!kit.isPublished ? (
              <Text style={[styles.muted, { color: c.ink }]}>
                Publish to open the page and let brands scan the code.
              </Text>
            ) : null}
            {qrSvg ? (
              <View style={styles.qrWrap}>
                <View style={styles.qrBox}>
                  <SvgXml xml={qrSvg} width={168} height={168} />
                </View>
                <Text style={[styles.muted, { color: c.ink, textAlign: 'center' }]}>
                  Scan to open your media kit
                </Text>
              </View>
            ) : null}
          </View>

          {/* Score */}
          <KollabSectionLabel label="creator score" />
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            {snapshot.viral.score != null ? (
              <>
                <View style={styles.scoreRow}>
                  <View style={[styles.scoreRing, { borderColor: c.violet }]}>
                    <Text style={[styles.scoreNum, { color: c.ink }]}>{snapshot.viral.score}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.strong, { color: c.ink }]}>{snapshot.viral.label}</Text>
                    <Text style={[styles.muted, { color: c.ink }]}>
                      Calculated from your real post and audience data.
                    </Text>
                  </View>
                </View>
                {snapshot.viral.components.map((comp) => (
                  <View key={comp.key} style={styles.barRow}>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.barLabel, { color: c.ink }]}>{comp.label}</Text>
                      <Text style={[styles.barLabel, { color: c.ink }]}>{comp.value}</Text>
                    </View>
                    <View style={[styles.track, { backgroundColor: c.hairline }]}>
                      <View
                        style={[
                          styles.fill,
                          { backgroundColor: c.violet, width: `${Math.max(2, comp.value)}%` },
                        ]}
                      />
                    </View>
                    <Text style={[styles.tiny, { color: c.ink }]}>{comp.detail}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={[styles.muted, { color: c.ink }]}>
                Not enough real data for a score yet. We never invent numbers.
              </Text>
            )}
            {snapshot.viral.missing.map((m) => (
              <Text key={m} style={[styles.hint, { color: c.violetDeep }]}>
                • {m}
              </Text>
            ))}
          </View>

          {/* Price range */}
          <KollabSectionLabel label="price range" />
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            {snapshot.rates.range ? (
              <>
                <Text style={[styles.big, { color: c.ink }]}>
                  {formatInr(snapshot.rates.range.min)}
                  {snapshot.rates.range.max !== snapshot.rates.range.min
                    ? ` – ${formatInr(snapshot.rates.range.max)}`
                    : ''}
                </Text>
                <Text style={[styles.muted, { color: c.ink }]}>
                  {snapshot.rates.range.basis === 'rate_card'
                    ? 'From your price card, per deliverable.'
                    : 'Estimated from your niche and country. Set your own price card to replace it.'}
                </Text>
              </>
            ) : (
              <Text style={[styles.muted, { color: c.ink }]}>
                Complete your profile or set your price card to show a range.
              </Text>
            )}
          </View>

          {/* Template */}
          <KollabSectionLabel label="template" />
          <View style={styles.templateGrid}>
            {KIT_TEMPLATES.map((t) => (
              <TemplateCard
                key={t.key}
                template={t.key}
                label={t.label}
                blurb={t.blurb}
                selected={draft.template === t.key}
                onPress={() => patch({ template: t.key })}
              />
            ))}
          </View>

          {/* Content */}
          <KollabSectionLabel label="about you" />
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <Field label="Display name">
              <KollabTextField
                surface="well"
                value={draft.displayName}
                onChangeText={(v) => patch({ displayName: v })}
                maxLength={120}
              />
            </Field>
            <Field label="Headline">
              <KollabTextField
                surface="well"
                value={draft.headline}
                onChangeText={(v) => patch({ headline: v })}
                placeholder="e.g. Fitness creator from Anantapur"
                maxLength={160}
              />
            </Field>
            <Field label="Bio">
              <KollabTextField
                surface="well"
                value={draft.bio}
                onChangeText={(v) => patch({ bio: v })}
                placeholder="Tell brands what you make and who watches"
                multiline
                maxLength={1200}
              />
            </Field>
            <KollabButton
              label="Write with AI"
              variant="soft"
              compact
              loading={writing}
              onPress={() => void writeWithAi()}
            />
          </View>

          <KollabSectionLabel label="featured work" />
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            {draft.links.map((l) => (
              <View key={l.key} style={[styles.linkCard, { borderColor: c.outline }]}>
                <KollabTextField
                  surface="well"
                  value={l.label}
                  onChangeText={(v) =>
                    patch({
                      links: draft.links.map((x) => (x.key === l.key ? { ...x, label: v } : x)),
                    })
                  }
                  placeholder="Title, e.g. Best reel"
                  maxLength={60}
                />
                <KollabTextField
                  surface="well"
                  value={l.url}
                  onChangeText={(v) =>
                    patch({
                      links: draft.links.map((x) => (x.key === l.key ? { ...x, url: v } : x)),
                    })
                  }
                  placeholder="https://"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  maxLength={500}
                />
                <Pressable
                  onPress={() => patch({ links: draft.links.filter((x) => x.key !== l.key) })}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remove link"
                >
                  <Text style={[styles.remove, { color: c.heat }]}>Remove</Text>
                </Pressable>
              </View>
            ))}
            {draft.links.length < overview.maxLinks ? (
              <KollabButton
                label="Add a link"
                variant="hairline"
                compact
                onPress={() => patch({ links: [...draft.links, newLink()] })}
              />
            ) : (
              <Text style={[styles.muted, { color: c.ink }]}>
                You can feature up to {overview.maxLinks} links.
              </Text>
            )}
          </View>

          <KollabSectionLabel label="what brands see" />
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <ToggleRow
              label="Audience stats"
              value={draft.showStats}
              onChange={(v) => patch({ showStats: v })}
            />
            <ToggleRow
              label="Creator score"
              value={draft.showScore}
              onChange={(v) => patch({ showScore: v })}
            />
            <ToggleRow
              label="Rates and price range"
              value={draft.showRates}
              onChange={(v) => patch({ showRates: v })}
            />
            <ToggleRow
              label="Show contact email"
              value={draft.showContact}
              onChange={(v) => patch({ showContact: v })}
            />
            <ToggleRow
              label="Accept enquiries (form on your page)"
              value={draft.acceptEnquiries}
              onChange={(v) => patch({ acceptEnquiries: v })}
            />
            <Field label="Contact email">
              <KollabTextField
                surface="well"
                value={draft.contactEmail}
                onChangeText={(v) => patch({ contactEmail: v })}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={255}
              />
            </Field>
            <Text style={[styles.tiny, { color: c.ink }]}>
              Your email is only shown if you switch it on. Enquiries land in Leads and are never
              emailed to the public.
            </Text>
            <KollabButton
              label="Open Leads"
              variant="hairline"
              compact
              onPress={() => router.push('/account-screens/leads' as never)}
            />
          </View>

          <KollabSectionLabel label="link name" />
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <Field label="Your link ends with">
              <KollabTextField
                surface="well"
                value={draft.slug}
                onChangeText={onSlugChange}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </Field>
            {slugNote ? (
              <Text style={[styles.tiny, { color: slugNote.ok ? c.teal : c.heat }]}>
                {slugNote.text}
              </Text>
            ) : null}
            <Text style={[styles.tiny, { color: c.ink }]}>
              Changing it breaks links you already shared.
            </Text>
          </View>

          <KollabButton
            label={dirty ? 'Save changes' : 'Saved'}
            variant="ink"
            disabled={!dirty}
            loading={saving}
            onPress={() => void save()}
          />
        </View>
      ) : null}
    </ScrollScreen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const kollab = useKollab();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>{label}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const kollab = useKollab();
  const c = kollab.color;
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: c.ink }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.outline, true: c.violet }}
        thumbColor={c.card}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  hero: { borderRadius: 26, padding: 22, gap: 8 },
  heroTag: { fontFamily: font.bold, fontSize: 11.5, letterSpacing: 1.6 },
  heroTitle: { fontFamily: font.display, fontSize: 30, lineHeight: 34 },
  heroSub: { fontFamily: font.body, fontSize: 14, opacity: 0.8, lineHeight: 20 },
  card: { borderRadius: 22, padding: 16, gap: 10 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  strong: { fontFamily: font.bold, fontSize: 15.5 },
  muted: { fontFamily: font.body, fontSize: 13, opacity: 0.6, lineHeight: 18 },
  big: { fontFamily: font.display, fontSize: 26 },
  sectionTitle: { fontFamily: font.bold, fontSize: 17, marginTop: 4 },
  feature: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foot: { fontFamily: font.body, fontSize: 12.5, opacity: 0.5, textAlign: 'center' },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  link: { fontFamily: font.medium, fontSize: 13.5 },
  btnRow: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  qrWrap: { alignItems: 'center', gap: 8, marginTop: 6 },
  qrBox: { backgroundColor: '#ffffff', padding: 8, borderRadius: 12 },
  scoreRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  scoreRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: { fontFamily: font.display, fontSize: 26 },
  barRow: { gap: 4 },
  barLabel: { fontFamily: font.semiBold, fontSize: 12.5 },
  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4 },
  tiny: { fontFamily: font.body, fontSize: 11.5, opacity: 0.55 },
  hint: { fontFamily: font.medium, fontSize: 12.5 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: font.semiBold, fontSize: 12.5, opacity: 0.7, marginLeft: 4 },
  linkCard: { borderWidth: 1.5, borderRadius: 18, padding: 10, gap: 8 },
  remove: { fontFamily: font.semiBold, fontSize: 12.5, alignSelf: 'flex-end', marginRight: 6 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontFamily: font.semiBold, fontSize: 14 },
});

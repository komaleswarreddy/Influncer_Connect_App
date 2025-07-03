import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Constants for filter options
const AGE_GROUP_OPTIONS = [
  { value: 'all', label: 'All Ages' },
  { value: '13-17', label: '13-17 years' },
  { value: '18-24', label: '18-24 years' },
  { value: '25-34', label: '25-34 years' },
  { value: '35-44', label: '35-44 years' },
  { value: '45-54', label: '45-54 years' },
  { value: '55-64', label: '55-64 years' },
  { value: '65+', label: '65+ years' },
];

const NICHE_OPTIONS = [
  { value: 'all', label: 'All Niches' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'health', label: 'Health' },
  { value: 'food', label: 'Food' },
  { value: 'travel', label: 'Travel' },
  { value: 'technology', label: 'Technology' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'finance', label: 'Finance' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art' },
  { value: 'photography', label: 'Photography' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'home', label: 'Home & Decor' },
  { value: 'automotive', label: 'Automotive' },
];

interface CampaignFiltersProps {
  filters: {
    targetAudienceAgeGroup: string;
    requiredNiche: string;
    dateRange: {
      from: Date | null;
      to: Date | null;
    } | null;
    tenantId: string;
  };
  onFilterChange: (filters: {
    targetAudienceAgeGroup: string;
    requiredNiche: string;
    dateRange: {
      from: Date | null;
      to: Date | null;
    } | null;
    tenantId: string;
  }) => void;
  onReset: () => void;
  tenants?: Array<{
    id: string;
    tenantName: string;
    domain: string;
    subdomain: string;
    status: string;
  }>;
}

export default function CampaignFilters({
  filters,
  onFilterChange,
  onReset,
  tenants,
}: CampaignFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showAgeGroupPicker, setShowAgeGroupPicker] = useState(false);
  const [showNichePicker, setShowNichePicker] = useState(false);
  const [showTenantPicker, setShowTenantPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  const hasActiveFilters =
    filters.targetAudienceAgeGroup !== 'all' ||
    filters.requiredNiche !== 'all' ||
    filters.tenantId !== 'all' ||
    (filters.dateRange && (filters.dateRange.from || filters.dateRange.to));

  const toggleFilters = () => {
    if (showFilters) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setShowFilters(false));
    } else {
      setShowFilters(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const handleDateSelect = (date: Date) => {
    const currentRange = filters.dateRange || { from: null, to: null };
    
    if (!currentRange.from || (currentRange.from && currentRange.to)) {
      // Start new range
      handleFilterChange('dateRange', { from: date, to: null });
    } else {
      // Complete the range
      if (date < currentRange.from) {
        handleFilterChange('dateRange', { from: date, to: currentRange.from });
      } else {
        handleFilterChange('dateRange', { from: currentRange.from, to: date });
      }
      setShowDatePicker(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDateRangeText = () => {
    if (!filters.dateRange) return 'Select Date Range';
    if (filters.dateRange.from && filters.dateRange.to) {
      return `${formatDate(filters.dateRange.from)} - ${formatDate(filters.dateRange.to)}`;
    }
    if (filters.dateRange.from) {
      return `${formatDate(filters.dateRange.from)} - Select End Date`;
    }
    return 'Select Date Range';
  };

  const getAgeGroupLabel = () => {
    const option = AGE_GROUP_OPTIONS.find(opt => opt.value === filters.targetAudienceAgeGroup);
    return option ? option.label : 'Select Age Group';
  };

  const getNicheLabel = () => {
    const option = NICHE_OPTIONS.find(opt => opt.value === filters.requiredNiche);
    return option ? option.label : 'Select Niche';
  };

  const getTenantLabel = () => {
    if (filters.tenantId === 'all') return 'All Brands';
    const tenant = tenants?.find(t => t.id === filters.tenantId);
    return tenant ? tenant.tenantName : 'Select Brand';
  };

  const renderFilterChips = () => {
    const chips = [];
    
    if (filters.targetAudienceAgeGroup !== 'all') {
      chips.push(
        <View key="age" style={styles.chip}>
          <Text style={styles.chipText}>{getAgeGroupLabel()}</Text>
          <TouchableOpacity
            onPress={() => handleFilterChange('targetAudienceAgeGroup', 'all')}
            style={styles.chipClose}
          >
            <Ionicons name="close" size={14} color="#14b8a6" />
          </TouchableOpacity>
        </View>
      );
    }
    
    if (filters.requiredNiche !== 'all') {
      chips.push(
        <View key="niche" style={styles.chip}>
          <Text style={styles.chipText}>{getNicheLabel()}</Text>
          <TouchableOpacity
            onPress={() => handleFilterChange('requiredNiche', 'all')}
            style={styles.chipClose}
          >
            <Ionicons name="close" size={14} color="#14b8a6" />
          </TouchableOpacity>
        </View>
      );
    }
    
    if (filters.tenantId !== 'all') {
      chips.push(
        <View key="tenant" style={styles.chip}>
          <Text style={styles.chipText}>{getTenantLabel()}</Text>
          <TouchableOpacity
            onPress={() => handleFilterChange('tenantId', 'all')}
            style={styles.chipClose}
          >
            <Ionicons name="close" size={14} color="#14b8a6" />
          </TouchableOpacity>
        </View>
      );
    }
    
    if (filters.dateRange && (filters.dateRange.from || filters.dateRange.to)) {
      chips.push(
        <View key="date" style={styles.chip}>
          <Text style={styles.chipText}>{getDateRangeText()}</Text>
          <TouchableOpacity
            onPress={() => handleFilterChange('dateRange', null)}
            style={styles.chipClose}
          >
            <Ionicons name="close" size={14} color="#14b8a6" />
          </TouchableOpacity>
        </View>
      );
    }
    
    return chips;
  };

  return (
    <View style={styles.container}>
      {/* Filter Button */}
      <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
        <Ionicons name="filter" size={20} color="#14b8a6" />
        <Text style={styles.filterButtonText}>Filters</Text>
        {hasActiveFilters && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
        >
          {renderFilterChips()}
          <TouchableOpacity style={styles.clearAllButton} onPress={onReset}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={toggleFilters}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Campaigns</Text>
              <TouchableOpacity onPress={toggleFilters} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#14b8a6" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Age Group Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Age Group</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowAgeGroupPicker(true)}
                >
                  <Text style={styles.pickerButtonText}>{getAgeGroupLabel()}</Text>
                  <Ionicons name="chevron-down" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Niche Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Niche</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowNichePicker(true)}
                >
                  <Text style={styles.pickerButtonText}>{getNicheLabel()}</Text>
                  <Ionicons name="chevron-down" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Brand Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Choose the Brand</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTenantPicker(true)}
                >
                  <Text style={styles.pickerButtonText}>{getTenantLabel()}</Text>
                  <Ionicons name="business" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.pickerButtonText}>{getDateRangeText()}</Text>
                  <Ionicons name="calendar" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.resetButton} onPress={onReset}>
                  <Text style={styles.resetButtonText}>Reset Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={toggleFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Age Group Picker Modal */}
      <Modal
        visible={showAgeGroupPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAgeGroupPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Age Group</Text>
              <TouchableOpacity onPress={() => setShowAgeGroupPicker(false)}>
                <Ionicons name="close" size={24} color="#14b8a6" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {AGE_GROUP_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerItem,
                    filters.targetAudienceAgeGroup === option.value && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    handleFilterChange('targetAudienceAgeGroup', option.value);
                    setShowAgeGroupPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      filters.targetAudienceAgeGroup === option.value && styles.pickerItemTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {filters.targetAudienceAgeGroup === option.value && (
                    <Ionicons name="checkmark" size={20} color="#14b8a6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Niche Picker Modal */}
      <Modal
        visible={showNichePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNichePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Niche</Text>
              <TouchableOpacity onPress={() => setShowNichePicker(false)}>
                <Ionicons name="close" size={24} color="#14b8a6" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {NICHE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerItem,
                    filters.requiredNiche === option.value && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    handleFilterChange('requiredNiche', option.value);
                    setShowNichePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      filters.requiredNiche === option.value && styles.pickerItemTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {filters.requiredNiche === option.value && (
                    <Ionicons name="checkmark" size={20} color="#14b8a6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tenant Picker Modal */}
      <Modal
        visible={showTenantPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTenantPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Choose the Brand</Text>
              <TouchableOpacity onPress={() => setShowTenantPicker(false)}>
                <Ionicons name="close" size={24} color="#14b8a6" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  filters.tenantId === 'all' && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  handleFilterChange('tenantId', 'all');
                  setShowTenantPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    filters.tenantId === 'all' && styles.pickerItemTextSelected,
                  ]}
                >
                  All Brands
                </Text>
                {filters.tenantId === 'all' && (
                  <Ionicons name="checkmark" size={20} color="#14b8a6" />
                )}
              </TouchableOpacity>
              {tenants?.map((tenant) => (
                <TouchableOpacity
                  key={tenant.id}
                  style={[
                    styles.pickerItem,
                    filters.tenantId === tenant.id && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    handleFilterChange('tenantId', tenant.id);
                    setShowTenantPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      filters.tenantId === tenant.id && styles.pickerItemTextSelected,
                    ]}
                  >
                    {tenant.tenantName}
                  </Text>
                  {filters.tenantId === tenant.id && (
                    <Ionicons name="checkmark" size={20} color="#14b8a6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#14b8a6" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              <Text style={styles.dateHelperText}>
                {!filters.dateRange?.from 
                  ? 'Select start date' 
                  : !filters.dateRange?.to 
                    ? 'Select end date' 
                    : 'Date range selected'}
              </Text>
              {/* Simple date selection - you can enhance this with a proper date picker */}
              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const today = new Date();
                  handleDateSelect(today);
                }}
              >
                <Text style={styles.dateOptionText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  handleDateSelect(tomorrow);
                }}
              >
                <Text style={styles.dateOptionText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  handleDateSelect(nextWeek);
                }}
              >
                <Text style={styles.dateOptionText}>Next Week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const nextMonth = new Date();
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  handleDateSelect(nextMonth);
                }}
              >
                <Text style={styles.dateOptionText}>Next Month</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdfa',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#14b8a6',
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#14b8a6',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  chipsContainer: {
    maxHeight: 50,
    paddingHorizontal: 16,
  },
  chipsContent: {
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2f1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    color: '#14b8a6',
    fontWeight: '600',
    marginRight: 4,
  },
  chipClose: {
    padding: 2,
  },
  clearAllButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14b8a6',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14b8a6',
  },
  pickerList: {
    padding: 20,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerItemSelected: {
    backgroundColor: '#e0f2f1',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerItemTextSelected: {
    color: '#14b8a6',
    fontWeight: '600',
  },
  dateHelperText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  dateOption: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#f9fafb',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#374151',
  },
}); 
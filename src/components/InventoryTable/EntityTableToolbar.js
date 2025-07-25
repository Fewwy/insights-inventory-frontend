import './EntityTableToolbar.scss';
import React, { Fragment, useEffect, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Skeleton,
  SkeletonSize,
} from '@redhat-cloud-services/frontend-components/Skeleton';
import {
  mapGroups,
  tagsFilterReducer,
  tagsFilterState,
} from '@redhat-cloud-services/frontend-components/FilterHooks';
import { PrimaryToolbar } from '@redhat-cloud-services/frontend-components/PrimaryToolbar';
import {
  clearFilters,
  fetchAllTags,
  setFilter,
  toggleTagModal,
} from '../../store/actions';
import debounce from 'lodash/debounce';
import {
  HOST_GROUP_CHIP,
  LAST_SEEN_CHIP,
  OS_CHIP,
  REGISTERED_CHIP,
  RHCD_FILTER_KEY,
  STALE_CHIP,
  TAG_CHIP,
  TEXTUAL_CHIP,
  TEXT_FILTER,
  TagsModal,
  UPDATE_METHOD_KEY,
  SYSTEM_TYPE_KEY,
  arrayToSelection,
  reduceFilters,
} from '../../Utilities/index';
import { onDeleteFilter, onDeleteGroupFilter, onDeleteTag } from './helpers';
import {
  filtersReducer,
  groupFilterReducer,
  groupFilterState,
  lastSeenFilterReducer,
  lastSeenFilterState,
  operatingSystemFilterReducer,
  operatingSystemFilterState,
  registeredWithFilterReducer,
  registeredWithFilterState,
  rhcdFilterReducer,
  rhcdFilterState,
  stalenessFilterReducer,
  stalenessFilterState,
  textFilterReducer,
  textFilterState,
  updateMethodFilterReducer,
  updateMethodFilterState,
  useLastSeenFilter,
  useOperatingSystemFilter,
  useRegisteredWithFilter,
  useRhcdFilter,
  useStalenessFilter,
  useTagsFilter,
  useTextFilter,
  useUpdateMethodFilter,
  useSystemTypeFilter,
  systemTypeFilterReducer,
  systemTypeFilterState,
} from '../filters';
import useFeatureFlag from '../../Utilities/useFeatureFlag';
import useGroupFilter from '../filters/useGroupFilter';
import { DatePicker, Split, SplitItem } from '@patternfly/react-core';
import { fromValidator, UNIX_EPOCH, toValidator } from '../filters/helpers';
import useInventoryExport from './hooks/useInventoryExport/useInventoryExport';

/**
 * Table toolbar used at top of inventory table.
 * It uses couple of filters and acces redux data along side all passed props.
 *  @param {*} props used in this component.
 */
const EntityTableToolbar = ({
  total,
  page,
  perPage,
  filterConfig,
  hasItems,
  children,
  actionsConfig,
  activeFiltersConfig,
  showTags,
  getTags,
  items,
  sortBy,
  customFilters,
  hasAccess,
  bulkSelect,
  hideFilters,
  paginationProps,
  onRefreshData,
  loaded,
  showTagModal,
  showSystemTypeFilter,
  showCentosVersions,
  showNoGroupOption,
  enableExport,
  fetchCustomOSes,
  ...props
}) => {
  const dispatch = useDispatch();
  const reducer = useReducer(
    filtersReducer([
      textFilterReducer,
      stalenessFilterReducer,
      registeredWithFilterReducer,
      tagsFilterReducer,
      operatingSystemFilterReducer,
      rhcdFilterReducer,
      lastSeenFilterReducer,
      updateMethodFilterReducer,
      groupFilterReducer,
      systemTypeFilterReducer,
    ]),
    {
      ...textFilterState,
      ...stalenessFilterState,
      ...registeredWithFilterState,
      ...tagsFilterState,
      ...operatingSystemFilterState,
      ...rhcdFilterState,
      ...updateMethodFilterState,
      ...lastSeenFilterState,
      ...groupFilterState,
      ...systemTypeFilterState,
    },
  );
  const activeFilters = useSelector(
    ({ entities: { activeFilters } }) => activeFilters,
  );
  const allTagsLoaded = useSelector(
    ({ entities: { allTagsLoaded } }) => allTagsLoaded,
  );
  const allTags = useSelector(({ entities: { allTags } }) => allTags);
  const additionalTagsCount = useSelector(
    ({ entities: { additionalTagsCount } }) => additionalTagsCount,
  );
  const [nameFilter, nameChip, textFilter, setTextFilter] =
    useTextFilter(reducer);
  const [stalenessFilter, stalenessChip, staleFilter, setStaleFilter] =
    useStalenessFilter(reducer);
  const [
    registeredFilter,
    registeredChip,
    registeredWithFilter,
    setRegisteredWithFilter,
  ] = useRegisteredWithFilter(reducer);
  const [
    rhcdFilterConfig,
    rhcdFilterChips,
    rhcdFilterValue,
    setRhcdFilterValue,
  ] = useRhcdFilter(reducer);
  const [
    lastSeenFilter,
    lastSeenChip,
    lastSeenFilterValue,
    setLastSeenFilterValue,
    onFromChange,
    onToChange,
    endDate,
    startDate,
    setStartDate,
    setEndDate,
  ] = useLastSeenFilter(reducer);
  const [osFilterConfig, osFilterChips, osFilterValue, setOsFilterValue] =
    useOperatingSystemFilter(
      reducer,
      [],
      hasAccess,
      showCentosVersions,
      fetchCustomOSes,
    );
  const [
    updateMethodConfig,
    updateMethodChips,
    updateMethodValue,
    setUpdateMethodValue,
  ] = useUpdateMethodFilter(reducer);

  const isKesselEnabled = useFeatureFlag('hbi.kessel-migration');
  const [hostGroupConfig, hostGroupChips, hostGroupValue, setHostGroupValue] =
    useGroupFilter(showNoGroupOption, isKesselEnabled);

  const isUpdateMethodEnabled = useFeatureFlag('hbi.ui.system-update-method');
  const { tagsFilter, tagsChip, selectedTags, setSelectedTags, filterTagsBy } =
    useTagsFilter(
      allTags,
      allTagsLoaded,
      additionalTagsCount,
      () => dispatch(toggleTagModal(true)),
      reducer,
    );

  const [
    systemTypeConfig,
    systemTypeChips,
    systemTypeValue,
    setSystemTypeValue,
  ] = useSystemTypeFilter(reducer);
  /**
   * Debounced function for fetching all tags.
   */
  const debounceGetAllTags = debounce((config, options) => {
    if (showTags && !hasItems && hasAccess) {
      dispatch(
        fetchAllTags(
          config,
          {
            ...options?.paginationhideFilters,
          },
          getTags,
        ),
      );
    }
  }, 800);

  const enabledFilters = {
    name: !(hideFilters.all && hideFilters.name !== false) && !hideFilters.name,
    stale:
      !(hideFilters.all && hideFilters.stale !== false) && !hideFilters.stale,
    registeredWith:
      !(hideFilters.all && hideFilters.registeredWith !== false) &&
      !hideFilters.registeredWith,
    operatingSystem:
      !(hideFilters.all && hideFilters.operatingSystem !== false) &&
      !hideFilters.operatingSystem,
    tags: !(hideFilters.all && hideFilters.tags !== false) && !hideFilters.tags,
    rhcdFilter:
      !(hideFilters.all && hideFilters.rhcdFilter !== false) &&
      !hideFilters.rhcdFilter,
    lastSeenFilter:
      !(hideFilters.all && hideFilters.lastSeen !== false) &&
      !hideFilters.lastSeen,
    //hides the filter untill API is ready. JIRA: RHIF-169
    updateMethodFilter:
      isUpdateMethodEnabled &&
      !(hideFilters.all && hideFilters.updateMethodFilter !== false) &&
      !hideFilters.updateMethodFilter,
    hostGroupFilter:
      !(hideFilters.all && hideFilters.hostGroupFilter !== false) &&
      !hideFilters.hostGroupFilter,
    systemTypeFilter:
      !(hideFilters.all && hideFilters.systemTypeFilter !== false) &&
      !hideFilters.systemTypeFilter,
  };

  const exportConfig = useInventoryExport({
    filters: {
      ...activeFilters,
      ...customFilters,
    },
  });

  /**
   * Function to dispatch load systems and fetch all tags.
   *  @param options
   */
  const onRefreshDataInner = (options) => {
    if (hasAccess) {
      onRefreshData(options);
      if (showTags && !hasItems) {
        dispatch(fetchAllTags(filterTagsBy, {}, getTags));
      }
    }
  };

  /**
   * Function used to update data, it either calls `onRefresh` from props or dispatches `onRefreshData`.
   * `onRefresh` function takes two parameters
   * entire config with new changes.
   * callback to update data.
   *  @param {*} config new config to fetch data.
   */
  const updateData = (config) => {
    if (hasAccess) {
      onRefreshDataInner(config);
    }
  };

  /**
   * Debounced `updateData` function.
   */
  const debouncedRefresh = debounce((config) => updateData(config), 800);

  /**
   * Component did mount effect to calculate actual filters from redux.
   */
  useEffect(() => {
    const {
      textFilter,
      tagFilters,
      staleFilter,
      registeredWithFilter,
      osFilter,
      rhcdFilter,
      lastSeenFilter,
      updateMethodFilter,
      hostGroupFilter,
      systemTypeFilter,
    } = reduceFilters([
      ...(activeFilters || []),
      ...(customFilters?.filters || []),
    ]);

    debouncedRefresh();
    enabledFilters.name && setTextFilter(textFilter);
    enabledFilters.stale && setStaleFilter(staleFilter);
    enabledFilters.registeredWith &&
      setRegisteredWithFilter(registeredWithFilter);
    enabledFilters.tags && setSelectedTags(tagFilters);
    enabledFilters.operatingSystem && setOsFilterValue(osFilter);
    enabledFilters.rhcdFilter && setRhcdFilterValue(rhcdFilter);
    enabledFilters.updateMethodFilter &&
      setUpdateMethodValue(updateMethodFilter);
    enabledFilters.lastSeenFilter && setLastSeenFilterValue(lastSeenFilter);
    enabledFilters.hostGroupFilter && setHostGroupValue(hostGroupFilter);
    enabledFilters.systemTypeFilter && setSystemTypeValue(systemTypeFilter);
  }, []);

  /**
   * Function used to change text filter.
   *  @param {*} value     new value used for filtering.
   *  @param {*} debounced if debounce function should be used.
   */
  const onSetTextFilter = (value, debounced = true) => {
    const trimmedValue = value?.trim();

    const textualFilter = activeFilters?.find(
      (oneFilter) => oneFilter.value === TEXT_FILTER,
    );
    if (textualFilter) {
      textualFilter.filter = trimmedValue;
    } else {
      if (trimmedValue) {
        // TODO This is sus
        activeFilters?.push({ value: TEXT_FILTER, filter: trimmedValue });
      }
    }

    const refresh = debounced ? debouncedRefresh : updateData;
    refresh({ page: 1, perPage, filters: activeFilters });
  };

  /**
   * General function to apply filter (excluding tag and text).
   *  @param {*} value     new value to be set of specified filter.
   *  @param {*} filterKey which filter should be changed.
   *  @param {*} refresh   refresh callback function.
   */
  const onSetFilter = (value, filterKey, refresh) => {
    const newFilters = [
      ...(activeFilters || []).filter(
        (oneFilter) =>
          !Object.prototype.hasOwnProperty.call(oneFilter, filterKey),
      ),
      { [filterKey]: value },
    ];
    refresh({ page: 1, perPage, filters: newFilters });
  };

  const shouldReload = page && perPage && activeFilters && (!hasItems || items);

  useEffect(() => {
    if (shouldReload && showTags && enabledFilters.tags) {
      debounceGetAllTags(filterTagsBy);
    }
  }, [filterTagsBy, customFilters?.tags]);

  useEffect(() => {
    if (shouldReload && enabledFilters.name) {
      onSetTextFilter(textFilter, true);
    }
  }, [textFilter]);

  useEffect(() => {
    if (shouldReload && enabledFilters.stale) {
      onSetFilter(staleFilter, 'staleFilter', debouncedRefresh);
    }
  }, [staleFilter]);

  useEffect(() => {
    if (shouldReload && enabledFilters.registeredWith) {
      onSetFilter(
        registeredWithFilter,
        'registeredWithFilter',
        debouncedRefresh,
      );
    }
  }, [registeredWithFilter]);

  useEffect(() => {
    if (shouldReload && showTags && enabledFilters.tags) {
      onSetFilter(mapGroups(selectedTags), 'tagFilters', debouncedRefresh);
    }
  }, [selectedTags]);

  useEffect(() => {
    if (shouldReload && enabledFilters.operatingSystem) {
      onSetFilter(osFilterValue, 'osFilter', debouncedRefresh);
    }
  }, [osFilterValue]);

  useEffect(() => {
    if (shouldReload && enabledFilters.rhcdFilter) {
      onSetFilter(rhcdFilterValue, 'rhcdFilter', debouncedRefresh);
    }
  }, [rhcdFilterValue]);

  useEffect(() => {
    if (shouldReload && enabledFilters.lastSeenFilter) {
      onSetFilter(lastSeenFilterValue, 'lastSeenFilter', debouncedRefresh);
    }
  }, [lastSeenFilterValue]);

  useEffect(() => {
    if (shouldReload && enabledFilters.updateMethodFilter) {
      onSetFilter(updateMethodValue, 'updateMethodFilter', debouncedRefresh);
    }
  }, [updateMethodValue]);

  useEffect(() => {
    if (shouldReload && enabledFilters.hostGroupFilter) {
      onSetFilter(hostGroupValue, 'hostGroupFilter', debouncedRefresh);
    }
  }, [hostGroupValue]);

  useEffect(() => {
    if (shouldReload && enabledFilters.systemTypeFilter) {
      onSetFilter(systemTypeValue, 'systemTypeFilter', debouncedRefresh);
    }
  }, [systemTypeValue]);

  /**
   * Mapper to simplify removing of any filter.
   */
  const deleteMapper = {
    [TEXTUAL_CHIP]: () => setTextFilter(''),
    [TAG_CHIP]: (deleted) =>
      setSelectedTags(
        onDeleteTag(deleted, selectedTags, (selectedTags) =>
          onSetFilter(mapGroups(selectedTags), 'tagFilters', updateData),
        ),
      ),
    [STALE_CHIP]: (deleted) =>
      setStaleFilter(onDeleteFilter(deleted, staleFilter)),
    [REGISTERED_CHIP]: (deleted) =>
      setRegisteredWithFilter(onDeleteFilter(deleted, registeredWithFilter)),
    [OS_CHIP]: (deleted) =>
      setOsFilterValue(onDeleteGroupFilter(deleted, osFilterValue)),
    [RHCD_FILTER_KEY]: (deleted) =>
      setRhcdFilterValue(onDeleteFilter(deleted, rhcdFilterValue)),
    [LAST_SEEN_CHIP]: (deleted) => {
      setLastSeenFilterValue(
        onDeleteFilter(deleted, [lastSeenFilterValue.mark]),
      );
      setStartDate();
      setEndDate();
    },
    [UPDATE_METHOD_KEY]: (deleted) =>
      setUpdateMethodValue(onDeleteFilter(deleted, updateMethodValue)),
    [HOST_GROUP_CHIP]: (deleted) =>
      setHostGroupValue(onDeleteFilter(deleted, hostGroupValue)),
    [SYSTEM_TYPE_KEY]: (deleted) =>
      setSystemTypeValue(onDeleteFilter(deleted, systemTypeValue)),
  };
  /**
   * Function to reset all filters with 'Reset Filter' is clicked
   */
  const resetFilters = () => {
    enabledFilters.name && setTextFilter('');
    enabledFilters.stale && setStaleFilter([]);
    enabledFilters.registeredWith && setRegisteredWithFilter([]);
    enabledFilters.tags && setSelectedTags({});
    enabledFilters.operatingSystem && setOsFilterValue([]);
    enabledFilters.rhcdFilter && setRhcdFilterValue([]);
    enabledFilters.lastSeenFilter && setLastSeenFilterValue([]);
    enabledFilters.updateMethodFilter && setUpdateMethodValue([]);
    enabledFilters.hostGroupFilter && setHostGroupValue([]);
    enabledFilters.systemTypeFilter && setSystemTypeValue([]);
    setEndDate();
    setStartDate(UNIX_EPOCH);
    dispatch(setFilter([]));
    updateData({ page: 1, filters: [] });
  };

  /**
   * Function to create active filters chips.
   */
  const constructFilters = () => {
    return {
      ...(activeFiltersConfig || {}),
      filters: [
        ...(showTags && !hasItems && enabledFilters.tags ? tagsChip : []),
        ...(!hasItems && enabledFilters.name ? nameChip : []),
        ...(!hasItems && enabledFilters.stale ? stalenessChip : []),
        ...(!hasItems && enabledFilters.registeredWith ? registeredChip : []),
        ...(!hasItems && enabledFilters.operatingSystem ? osFilterChips : []),
        ...(!hasItems && enabledFilters.rhcdFilter ? rhcdFilterChips : []),
        ...(!hasItems && enabledFilters.updateMethodFilter
          ? updateMethodChips
          : []),
        ...(!hasItems && enabledFilters.lastSeenFilter ? lastSeenChip : []),
        ...(!hasItems && enabledFilters.hostGroupFilter ? hostGroupChips : []),
        ...(showSystemTypeFilter && !hasItems && enabledFilters.systemTypeFilter
          ? systemTypeChips
          : []),
        ...(activeFiltersConfig?.filters || []),
      ],
      onDelete: (e, [deleted, ...restDeleted], isAll) => {
        if (isAll) {
          dispatch(clearFilters());
          resetFilters();
        } else {
          deleteMapper[deleted.type]?.(deleted);
        }

        activeFiltersConfig &&
          activeFiltersConfig.onDelete &&
          activeFiltersConfig.onDelete(e, [deleted, ...restDeleted], isAll);
      },
    };
  };

  const inventoryFilters = [
    ...(!hasItems
      ? [
          ...(enabledFilters.name ? [nameFilter] : []),
          ...(enabledFilters.stale ? [stalenessFilter] : []),
          ...(enabledFilters.operatingSystem ? [osFilterConfig] : []),
          ...(enabledFilters.registeredWith ? [registeredFilter] : []),
          ...(enabledFilters.rhcdFilter ? [rhcdFilterConfig] : []),
          ...(enabledFilters.updateMethodFilter ? [updateMethodConfig] : []),
          ...(enabledFilters.lastSeenFilter ? [lastSeenFilter] : []),
          ...(enabledFilters.hostGroupFilter ? [hostGroupConfig] : []),
          ...(showSystemTypeFilter && enabledFilters.systemTypeFilter
            ? [systemTypeConfig]
            : []),
          ...(showTags && enabledFilters.tags ? [tagsFilter] : []),
        ]
      : []),
    ...(filterConfig?.items || []),
  ];
  const preselectedTags = Object.entries(selectedTags).reduce(
    (sTags, [namespace, tag]) => {
      const tags = Object.values(tag).map(
        ({
          item: {
            meta: {
              tag: { key, value },
            },
          },
        }) => ({
          id: `${namespace}/${key}=${value}`,
          cells: [key, value, namespace],
          item: {
            meta: {
              tag: { key, value },
            },
          },
        }),
      );

      return [...sTags, ...tags];
    },
    [],
  );

  return (
    <Fragment>
      <PrimaryToolbar
        {...props}
        {...(bulkSelect && {
          bulkSelect: {
            ...bulkSelect,
            isDisabled: bulkSelect?.isDisabled || !hasAccess,
          },
        })}
        className={`ins-c-inventory__table--toolbar ${
          hasItems || !inventoryFilters.length
            ? 'ins-c-inventory__table--toolbar-has-items'
            : ''
        }`}
        {...(inventoryFilters?.length > 0 && {
          filterConfig: {
            ...(filterConfig || {}),
            isDisabled: !hasAccess,
            items: inventoryFilters?.map((filter) => ({
              ...filter,
              filterValues: {
                placeholder:
                  filter?.filterValues?.placeholder ||
                  `Filter by ${filter?.label?.toLowerCase()}`,
                ...filter?.filterValues,
                isDisabled: !hasAccess,
              },
            })),
          },
        })}
        {...(hasAccess && { activeFiltersConfig: constructFilters() })}
        actionsConfig={loaded ? actionsConfig : null}
        pagination={
          loaded ? (
            {
              page,
              itemCount: !hasAccess ? 0 : total,
              isDisabled: !hasAccess,
              perPage,
              onSetPage: (_e, newPage) => onRefreshData({ page: newPage }),
              onPerPageSelect: (_e, newPerPage) =>
                onRefreshData({ page: 1, per_page: newPerPage }),
              titles: {
                optionsToggleAriaLabel: 'Items per page',
              },
              ...paginationProps,
            }
          ) : (
            <Skeleton size={SkeletonSize.lg} />
          )
        }
        exportConfig={
          props.exportConfig ? props.exportConfig : enableExport && exportConfig
        }
      >
        {lastSeenFilterValue?.mark === 'custom' && (
          <Split>
            <SplitItem>
              <DatePicker
                onChange={onFromChange}
                aria-label="Start date"
                validators={[fromValidator(endDate)]}
                placeholder="Start"
              />
            </SplitItem>
            <SplitItem style={{ padding: '6px 12px 0 12px' }}>to</SplitItem>
            <SplitItem>
              <DatePicker
                value={endDate}
                onChange={onToChange}
                rangeStart={
                  startDate === UNIX_EPOCH ? new Date() : new Date(startDate)
                }
                validators={[toValidator(startDate)]}
                aria-label="End date"
                placeholder="End"
              />
            </SplitItem>
          </Split>
        )}
        {children}
      </PrimaryToolbar>
      {(showTags || enabledFilters.tags || showTagModal) && (
        <TagsModal
          selected={preselectedTags}
          filterTagsBy={filterTagsBy}
          onApply={(selected) => setSelectedTags(arrayToSelection(selected))}
          getTags={getTags}
        />
      )}
    </Fragment>
  );
};

EntityTableToolbar.propTypes = {
  showTags: PropTypes.bool,
  getTags: PropTypes.func,
  hasAccess: PropTypes.bool,
  filterConfig: PropTypes.object,
  total: PropTypes.number,
  hasItems: PropTypes.bool,
  page: PropTypes.number,
  onClearFilters: PropTypes.func,
  toggleTagModal: PropTypes.func,
  perPage: PropTypes.number,
  children: PropTypes.node,
  pagination: PropTypes.shape({
    page: PropTypes.number,
    perPage: PropTypes.number,
  }),
  actionsConfig: PropTypes.object,
  activeFiltersConfig: PropTypes.object,
  onRefreshData: PropTypes.func,
  customFilters: PropTypes.shape({
    tags: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    filters: PropTypes.array,
  }),
  hideFilters: PropTypes.shape({
    tags: PropTypes.bool,
    name: PropTypes.bool,
    registeredWith: PropTypes.bool,
    stale: PropTypes.bool,
    operatingSystem: PropTypes.bool,
    rhcdFilter: PropTypes.bool,
    lastSeen: PropTypes.bool,
    updateMethodFilter: PropTypes.bool,
    hostGroupFilter: PropTypes.bool,
    systemTypeFilter: PropTypes.bool,
    all: PropTypes.bool,
  }),
  paginationProps: PropTypes.object,
  loaded: PropTypes.bool,
  onRefresh: PropTypes.func,
  hasCheckbox: PropTypes.bool,
  isLoaded: PropTypes.bool,
  items: PropTypes.array,
  sortBy: PropTypes.object,
  bulkSelect: PropTypes.object,
  showTagModal: PropTypes.bool,
  disableDefaultColumns: PropTypes.any,
  showCentosVersions: PropTypes.bool,
  showSystemTypeFilter: PropTypes.bool,
  showNoGroupOption: PropTypes.bool,
  enableExport: PropTypes.bool,
  exportConfig: PropTypes.object,
  fetchCustomOSes: PropTypes.func,
};

EntityTableToolbar.defaultProps = {
  showTags: false,
  hasAccess: true,
  activeFiltersConfig: {},
  hideFilters: {},
  showNoGroupOption: false,
};

export default EntityTableToolbar;

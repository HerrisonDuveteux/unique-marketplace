// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './styles.scss';

import type { NftCollectionInterface } from '@polkadot/react-hooks/useCollection';
import type { OfferType } from '@polkadot/react-hooks/useCollections';

// external imports
import React, { memo, ReactElement, useCallback, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { useHistory } from 'react-router';
import Grid from 'semantic-ui-react/dist/commonjs/collections/Grid';
import Header from 'semantic-ui-react/dist/commonjs/elements/Header';
import Loader from 'semantic-ui-react/dist/commonjs/elements/Loader';

import { Checkbox, Input } from '@polkadot/react-components';
import { AttributeItemType, fillAttributes } from '@polkadot/react-components/util/protobufUtils';
import { useCollection, useCollections, useDecoder } from '@polkadot/react-hooks';
import { AttributesDecoded } from '@polkadot/react-hooks/useSchema';

// local imports and components
import NftTokenCard from '../../components/NftTokenCard';

interface BuyTokensProps {
  account?: string;
  setShouldUpdateTokens: (value?: string) => void;
  shouldUpdateTokens?: string;
}

interface OfferWithAttributes {
  [collectionId: string]: {[tokenId: string]: AttributesDecoded}
}

const perPage = 20;

const BuyTokens = ({ account, setShouldUpdateTokens, shouldUpdateTokens }: BuyTokensProps): ReactElement => {
  const history = useHistory();
  const { getOffers, offers, offersCount, presetMintTokenCollection } = useCollections();
  const { getCollectionOnChainSchema } = useCollection();
  const [searchString, setSearchString] = useState<string>('');
  const [allAttributes, setAllAttributes] = useState<{ [key: string]: { [key: string]: boolean }}>({});
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: { [key: string]: boolean }}>({});
  const [offersWithAttributes, setOffersWithAttributes] = useState<OfferWithAttributes>({});
  // const [collectionSearchString, setCollectionSearchString] = useState<string>('');
  const [collections, setCollections] = useState<NftCollectionInterface[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<OfferType[]>([]);
  const { collectionName16Decoder } = useDecoder();
  const hasMore = !!(offers && offersCount) && Object.keys(offers).length < offersCount;

  const openDetailedInformationModal = useCallback((collectionId: string, tokenId: string) => {
    history.push(`/market/token-details?collectionId=${collectionId}&tokenId=${tokenId}`);
  }, [history]);

  const addMintCollectionToList = useCallback(async () => {
    const firstCollections: NftCollectionInterface[] = await presetMintTokenCollection();

    setCollections(() => [...firstCollections]);
  }, [presetMintTokenCollection]);

  const onSetTokenAttributes = useCallback((collectionId: string, tokenId: string, attributes: AttributesDecoded) => {
    setOffersWithAttributes((prevOffers: OfferWithAttributes) => {
      const newOffers = { ...prevOffers };

      if (newOffers[collectionId]) {
        newOffers[collectionId][tokenId] = attributes;
      } else {
        newOffers[collectionId] = { [tokenId]: attributes };
      }

      return newOffers;
    });
  }, []);

  const fetchData = useCallback((newPage: number) => {
    getOffers(newPage, perPage, '23');
  }, [getOffers]);

  const toggleAttributeFilter = useCallback((attKey: string, attItemKey: string) => {
    setAllAttributes((prevAttributes) => {
      setSelectedAttributes((prev) => {
        if (!prevAttributes[attKey][attItemKey]) {
          return { ...prev, [attKey]: { ...prev[attKey], [attItemKey]: true } };
        }

        const newAttr = { ...prev };

        delete newAttr[attKey][attItemKey];

        if (!Object.keys(newAttr[attKey]).length) {
          delete newAttr[attKey];
        }

        return newAttr;
      });

      return {
        ...prevAttributes,
        [attKey]: {
          ...prevAttributes[attKey],
          [attItemKey]: !prevAttributes[attKey][attItemKey]
        }
      };
    });
  }, []);

  const presetCollectionAttributes = useCallback((collection: NftCollectionInterface) => {
    const onChainSchema = getCollectionOnChainSchema(collection);
    let constAttributes: AttributeItemType[] = [];
    let varAttributes: AttributeItemType[] = [];
    let attributes: AttributeItemType[] = [];

    if (onChainSchema) {
      const { constSchema, variableSchema } = onChainSchema;

      if (constSchema) {
        constAttributes = fillAttributes(constSchema);
      }

      if (variableSchema) {
        varAttributes = fillAttributes(variableSchema);
      }

      attributes = [...constAttributes, ...varAttributes].sort((a: AttributeItemType, b: AttributeItemType) => a.name.localeCompare(b.name));

      const attributesFilter: { [key: string]: { [key: string]: boolean }} = {};

      if (attributes.length) {
        attributes.forEach((attr) => {
          if (attr.fieldType === 'enum') {
            attributesFilter[attr.name] = {};

            attr.values.forEach((valueItem: string) => {
              attributesFilter[attr.name][valueItem] = false;
            });
          }
        });

        setAllAttributes(attributesFilter);
      }
    }
  }, [getCollectionOnChainSchema]);

  const filterTokensByAttributesOrSearchString = useCallback((offerItemAttrs: AttributesDecoded) => {
    return Object.keys(offerItemAttrs).find((attributeKey: string) => {
      if (!Object.keys(selectedAttributes).length) {
        return true;
      }

      if (Array.isArray(offerItemAttrs[attributeKey])) {
        return (offerItemAttrs[attributeKey] as string[])
          .find((targetAttr: string) => selectedAttributes[attributeKey] && selectedAttributes[attributeKey][targetAttr]);
      } else {
        return selectedAttributes[attributeKey] && selectedAttributes[attributeKey][offerItemAttrs[attributeKey] as string];
      }
    }) && Object.keys(offerItemAttrs).find((attributeKey: string) => {
      if (Array.isArray(offerItemAttrs[attributeKey])) {
        return (offerItemAttrs[attributeKey] as string[])
          .find((targetAttr: string) => !searchString || (searchString && targetAttr.toLowerCase().includes(searchString.toLowerCase())));
      } else {
        return !searchString || (searchString && (offerItemAttrs[attributeKey] as string).toLowerCase().includes(searchString.toLowerCase()));
      }
    });
  }, [searchString, selectedAttributes]);

  // search filter
  useEffect(() => {
    if (offers) {
      if (!Object.keys(selectedAttributes).length && !searchString?.length) {
        setFilteredOffers(Object.values(offers));
      } else {
        const filtered = Object.values(offers).filter((item: OfferType) => {
          if (offersWithAttributes[item.collectionId] && offersWithAttributes[item.collectionId][item.tokenId]) {
            return filterTokensByAttributesOrSearchString(offersWithAttributes[item.collectionId][item.tokenId]);
          }

          return false;
        });

        setFilteredOffers(filtered);
      }
    }
  }, [allAttributes, filterTokensByAttributesOrSearchString, offers, offersWithAttributes, searchString, selectedAttributes]);

  useEffect(() => {
    if (shouldUpdateTokens) {
      void getOffers(1, perPage, '23');
      setShouldUpdateTokens(undefined);
    }
  }, [getOffers, shouldUpdateTokens, setShouldUpdateTokens]);

  useEffect(() => {
    void addMintCollectionToList();
  }, [addMintCollectionToList]);

  useEffect(() => {
    if (collections && collections[0]) {
      presetCollectionAttributes(collections[0]);
    }
  }, [collections, presetCollectionAttributes]);

  useEffect(() => {
    setShouldUpdateTokens('all');
  }, [setShouldUpdateTokens]);

  // console.log('filteredOffers', filteredOffers, 'selectedAttributes', selectedAttributes);

  return (
    <div className='nft-market'>
      <Header as='h1'>Market</Header>
      <Header as='h4'>Art gallery collections</Header>
      <Grid>
        <Grid.Row>
          <Grid.Column width={4}>
            <Header
              as='h5'
              className='sub-header'
            >
              Collections
            </Header>
            {/* <Input
              className='isSmall search'
              help={<span>Find and select tokens collection.</span>}
              isDisabled={!offers || !offers.length}
              label={'Find collection by name'}
              onChange={setSearchString}
              placeholder='Find collection by name or id'
              value={searchString}
              withLabel
            /> */}
            <ul className='collections-list'>
              { collections.map((collection) => (
                <li
                  className='collections-list__item'
                  key={collection.id}
                >
                  <div className='collections-list__img'>
                    {/* <Image src={} /> */}
                  </div>
                  <div className='collections-list__name'>{collectionName16Decoder(collection.Name)}</div>
                </li>
              ))}
            </ul>
            <hr/>
            <div className='tokens-filters'>
              <header>Filters:</header>
              { Object.keys(allAttributes).map((attributeKey: string) => (
                (
                  <div
                    className='tokens-filter'
                    key={attributeKey}
                  >
                    <header>{attributeKey}</header>
                    { Object.keys(allAttributes[attributeKey]).map((attributeItemKey: string) => (
                      <Checkbox
                        key={`${attributeKey}${attributeItemKey}`}
                        label={attributeItemKey}
                        onChange={toggleAttributeFilter.bind(null, attributeKey, attributeItemKey)}
                        value={allAttributes[attributeKey][attributeItemKey]}
                      />
                    ))}
                  </div>
                )
              ))}
            </div>
          </Grid.Column>
          <Grid.Column width={12}>
            <Grid>
              <Grid.Row>
                <Grid.Column width={16}>
                  <Input
                    className='isSmall search'
                    help={<span>Find and select token.</span>}
                    isDisabled={!offers || !Object.values(offers).length}
                    label={'Find token by name or collection'}
                    onChange={setSearchString}
                    placeholder='Search...'
                    value={searchString}
                    withLabel
                  />
                </Grid.Column>
              </Grid.Row>
              {(account && filteredOffers.length > 0) && (
                <Grid.Row>
                  <Grid.Column width={16}>
                    <div className='market-pallet'>
                      <InfiniteScroll
                        hasMore={hasMore}
                        initialLoad={false}
                        loadMore={fetchData}
                        loader={searchString && searchString.length
                          ? <></>
                          : <Loader
                            active
                            className='load-more'
                            inline='centered'
                            key={'nft-market'}
                          />}
                        pageStart={1}
                        threshold={200}
                        useWindow={true}
                      >
                        <div className='market-pallet__item'>
                          {filteredOffers.map((token) => (
                            <NftTokenCard
                              account={account}
                              collectionId={token.collectionId.toString()}
                              key={`${token.collectionId}-${token.tokenId}`}
                              onSetTokenAttributes={onSetTokenAttributes}
                              openDetailedInformationModal={openDetailedInformationModal}
                              token={token}
                            />
                          ))}
                        </div>
                      </InfiniteScroll>
                    </div>
                  </Grid.Column>
                </Grid.Row>
              )}
            </Grid>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
};

export default memo(BuyTokens);

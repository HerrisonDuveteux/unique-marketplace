// Copyright 2017-2021 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeDef } from '@polkadot/react-components/types';

import nf4Digital from '../public/logos/nf4Digital.png';
import UniqueLogo from '../public/logos/unique.svg';
import Vernissage from '../public/logos/vernissage.svg';
import FluffyLogo from '../public/logos/Logo_market.svg';

export const uniqueTheme: ThemeDef = {
  domain: 'whitelabel.market',
  logo: UniqueLogo as string,
  theme: 'Unique'
};

export const fluffyTheme: ThemeDef = {
  domain: 'whitelabel.market',
  logo:  FluffyLogo as string,
  theme: 'Fluffy'
};

export const nf3Theme: ThemeDef = {
  domain: 'nf3digital.com',
  ip: '35.168.59.239',
  logo: nf4Digital as string,
  theme: 'NF3Digital'
};

export const luvTheme: ThemeDef = {
  domain: 'luvnft.com',
  theme: 'LUVNFT'
};

export const vernissageTheme: ThemeDef = {
  domain: 'vernissage.art',
  logo: Vernissage as string,
  theme: 'Vernissage'
};

export const Themes: ThemeDef[] = [fluffyTheme, uniqueTheme, nf3Theme, luvTheme, vernissageTheme];

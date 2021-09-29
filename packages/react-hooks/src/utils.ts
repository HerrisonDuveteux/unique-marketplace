// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ContractPromise } from '@polkadot/api-contract';
import type { AbiMessage } from '@polkadot/api-contract/types';
import type { AccountId } from '@polkadot/types/interfaces';
import type { IKeyringPair } from '@polkadot/types/types';

import Web3 from 'web3';

import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { addressToEvm } from '@polkadot/util-crypto';

export const findCallMethodByName = (contractInstance: ContractPromise | null, methodName: string): AbiMessage | null => {
  const message = contractInstance && Object.values(contractInstance.abi.messages).find((message) => message.identifier === methodName);

  return message || null;
};

export function strToUTF16 (str: string): any {
  const buf: number[] = [];

  for (let i = 0, strLen = str.length; i < strLen; i++) {
    buf.push(str.charCodeAt(i));
  }

  return buf;
}

export type CrossAccountId = {
  substrate: string,
} | {
  ethereum: string,
};

export function normalizeAccountId (input: string | AccountId | CrossAccountId | IKeyringPair): CrossAccountId {
  if (typeof input === 'string') {
    return { substrate: input };
  }

  if ('address' in input) {
    return { substrate: input.address };
  }

  if ('ethereum' in input) {
    input.ethereum = input.ethereum.toLowerCase();

    return input;
  }

  if ('substrate' in input) {
    return input;
  }

  // AccountId
  return { substrate: input.toString() };
}

export function subToEthLowercase (account: string): string {
  const bytes = addressToEvm(account);

  return `0x${Buffer.from(bytes).toString('hex')}`;
}

export async function subToEth (account: string): Promise<string> {
  const accounts = await web3Accounts();
  const address = await web3FromAddress(account);

  console.log('web3Accounts', accounts, 'web3FromAddress', address);

  return Web3.utils.toChecksumAddress(subToEthLowercase(account));

  return '';
}

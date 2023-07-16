import { BigInt, dataSource, log } from '@graphprotocol/graph-ts';
import { RealmDiamond } from '../../generated/RealmDiamond/RealmDiamond';
import { Parcel } from '../../generated/schema';
import { AlchemicaTypes, HAMBLE_VP, PARTNER_VP, ParcelTypes, REASONABLE_VP, SPACIOUS_VP } from '../shared';

export const loadOrCreateParcel = (realmId: BigInt): Parcel => {
  const id = realmId.toString();
  let parcel = Parcel.load(id);

  if (!parcel) {
    parcel = new Parcel(id);
    parcel.installations = [];
    parcel.tiles = [];
    parcel.tokenId = realmId;
    parcel.timesTraded = BigInt.zero();
    parcel.alchemica = [BigInt.zero(), BigInt.zero(), BigInt.zero(), BigInt.zero()];
    parcel.capacities = [BigInt.zero(), BigInt.zero(), BigInt.zero(), BigInt.zero()];
    parcel.harvestRates = [BigInt.zero(), BigInt.zero(), BigInt.zero(), BigInt.zero()];
    parcel.availableAlchemica = [BigInt.zero(), BigInt.zero(), BigInt.zero(), BigInt.zero()];
  }

  log.warning('parcel: {}, diamond: {}', [realmId.toString(), dataSource.address().toHexString()]);

  if (!parcel.parcelId) {
    const contract = RealmDiamond.bind(dataSource.address());
    const _parcelInfo = contract.try_getParcelInfo(realmId);

    if (!_parcelInfo.reverted) {
      const metadata = _parcelInfo.value;

      parcel.parcelId = metadata.parcelId;
      parcel.parcelHash = metadata.parcelAddress;
      parcel.size = metadata.size;
      parcel.district = metadata.district;
      parcel.coordinateX = metadata.coordinateX;
      parcel.coordinateY = metadata.coordinateY;

      parcel.fudBoost = metadata.boost[AlchemicaTypes.Fud];
      parcel.fomoBoost = metadata.boost[AlchemicaTypes.Fomo];
      parcel.alphaBoost = metadata.boost[AlchemicaTypes.Alpha];
      parcel.kekBoost = metadata.boost[AlchemicaTypes.Kek];

      log.warning('parcel: {}, PARCEL INFO DATA ARRIVED, id - {}', [realmId.toString(), metadata.parcelId]);
    } else {
      log.error('parcel: {}, PARCEL INFO REVERTED', [realmId.toString()]);
    }

    const _parcelHarvestRates = contract.try_getHarvestRates(realmId);

    if (!_parcelHarvestRates.reverted) {
      const metadata = _parcelHarvestRates.value;
      parcel.harvestRates = metadata;

      log.warning('parcel: {}, PARCEL HARVEST DATA ARRIVED, id - {}', [realmId.toString(), metadata.toString()]);
    } else {
      log.error('parcel: {}, PARCEL HARVEST REVERTED', [realmId.toString()]);
    }

    const _parcelCapacities = contract.try_getCapacities(realmId);

    if (!_parcelCapacities.reverted) {
      const metadata = _parcelCapacities.value;
      parcel.capacities = metadata;

      log.warning('parcel: {}, PARCEL CAP DATA ARRIVED, id - {}', [realmId.toString(), metadata.toString()]);
    } else {
      log.error('parcel: {}, PARCEL CAP REVERTED', [realmId.toString()]);
    }

    const _parcelAvailableAlchemica = contract.try_getAvailableAlchemica(realmId);

    if (!_parcelAvailableAlchemica.reverted) {
      const metadata = _parcelAvailableAlchemica.value;
      parcel.availableAlchemica = metadata;

      log.warning('parcel: {}, PARCEL AVAILIBLE ALCHEMICA DATA ARRIVED, id - {}', [
        realmId.toString(),
        metadata.toString()
      ]);
    } else {
      log.error('parcel: {}, PARCEL AVAILIBLE ALCHEMICA  REVERTED', [realmId.toString()]);
    }
  }

  return parcel;
};

export const increaseCurrentSurvey = (alchemica: BigInt[], alchemicas: BigInt[]): BigInt[] => {
  const currentAlchemica = alchemica;

  currentAlchemica[AlchemicaTypes.Fud] = currentAlchemica[AlchemicaTypes.Fud].plus(alchemicas[AlchemicaTypes.Fud]);
  currentAlchemica[AlchemicaTypes.Fomo] = currentAlchemica[AlchemicaTypes.Fomo].plus(alchemicas[AlchemicaTypes.Fomo]);
  currentAlchemica[AlchemicaTypes.Alpha] = currentAlchemica[AlchemicaTypes.Alpha].plus(
    alchemicas[AlchemicaTypes.Alpha]
  );
  currentAlchemica[AlchemicaTypes.Kek] = currentAlchemica[AlchemicaTypes.Kek].plus(alchemicas[AlchemicaTypes.Kek]);

  return currentAlchemica;
};

export function getParcelVPBySize(size: BigInt): BigInt {
  switch (size.toI32()) {
    case ParcelTypes.Humble:
      return BigInt.fromI32(HAMBLE_VP);
    case ParcelTypes.Reasonable:
      return BigInt.fromI32(REASONABLE_VP);
    case ParcelTypes.SpaciousH || ParcelTypes.SpaciousV:
      return BigInt.fromI32(SPACIOUS_VP);
    case ParcelTypes.Partner || ParcelTypes.Guardian:
      return BigInt.fromI32(PARTNER_VP);
    default:
      return BigInt.zero();
  }
}

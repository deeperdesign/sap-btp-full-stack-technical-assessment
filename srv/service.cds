using { galactic as db } from '../db/schema';

// Require an authenticated user for every endpoint under /galactic.
@requires: 'authenticated-user'
@impl: './spacefarers-service.js'
service GalacticService @(path: '/galactic') {
  // Main List Report and Object Page entity.
  @Capabilities.InsertRestrictions : { Insertable : true }
  @Capabilities.UpdateRestrictions : { Updatable : true }
  @odata.draft.enabled
  entity Spacefarers       as projection on db.Spacefarers;

  // Supporting entities for association value help and navigation.
  entity Planets           as projection on db.Planets;
  entity Departments       as projection on db.Departments;
  entity Positions         as projection on db.Positions;
}

const cds = require('@sap/cds');
const { ulid } = require('ulid');

function getLogger(request) {
  return request.log || cds.log('GalacticService');
}

class IdentityContext {
  constructor(identity = {}) {
    this.identity = identity;
  }

  get userId() {
    return this.identity.attr?.userId
      || this.identity.id
      || this.identity.sub
      || this.identity.uid;
  }

  get isAdmin() {
    return this.identity.isAdmin === true;
  }

  get planetClaim() {
    return this.identity.planet
      || this.identity.tenant
      || this.identity.attr?.planet
      || this.identity.payload?.planet
      || null;
  }
}

class TenantAccessPolicy {
  authorizeCreate(data, identity, request) {
    if (!identity.isAdmin) {
      if (!identity.planetClaim) {
        request.reject(403, 'Missing planet claim in token; cannot create Spacefarer');
      }

      data.planet = { id: identity.planetClaim };
      return;
    }

    if (typeof data.planet === 'string') data.planet = { id: data.planet };
  }

  authorizeAccess(identity, request) {
    const operation = request.event || 'ACCESS';
    const userId = identity.userId || 'anonymous';
    const logger = getLogger(request);

    logger.debug(
      `Authorizing ${operation} Spacefarers user=${userId} admin=${identity.isAdmin}`,
    );

    if (!identity.isAdmin && !identity.planetClaim) {
      logger.warn(
        `Denied ${operation} Spacefarers user=${userId}: missing planet claim`,
      );
      request.reject(403, 'Missing planet claim in token');
    }

    if (!identity.isAdmin) {
      this.addTenantFilter(request, identity.planetClaim);
      this.rejectCrossTenantReassignment(request, identity);
      logger.debug(
        `Applied planet access filter for ${operation} Spacefarers planet=${identity.planetClaim}`,
      );
    } else {
      logger.debug(`Granted unrestricted ${operation} access for admin user=${userId}`);
    }
  }

  rejectCrossTenantReassignment(request, identity) {
    if (request.event !== 'UPDATE') return;

    const planet = request.data?.planet;
    const targetPlanetId = typeof planet === 'string' ? planet : planet?.id;

    if (targetPlanetId && targetPlanetId !== identity.planetClaim) {
      request.reject(403, 'Cannot reassign a Spacefarer to a different planet');
    }
  }

  addTenantFilter(request, planetId) {
    const queryPart = request.query.SELECT
      || request.query.UPDATE
      || request.query.DELETE;

    if (!queryPart) return;

    // Keep the caller's filters and add the tenant restriction with AND.
    // Reference the planet through the association (planet.id) so this works the same way regardless of the underlying database.
    // This app-level WHERE filter is not the best practice for large datasets 
    // Prefer an index on planet_id
    const tenantFilter = [
      { ref: ['planet', 'id'] },
      '=',
      { val: planetId },
    ];

    queryPart.where = queryPart.where?.length
      ? [...queryPart.where, 'and', ...tenantFilter]
      : tenantFilter;
  }
}

class SpacefarerRules {
  constructor({ idGenerator = ulid, timestampProvider = () => new Date() } = {}) {
    this.idGenerator = idGenerator;
    this.timestampProvider = timestampProvider;
  }

  enrich(data, request) {
    this.ensureId(data, request);
    data.createdAt = this.timestampProvider().toISOString();

    this.normalizeStardust(data);
    this.normalizeSkill(data, request);

    if (data.active == null) data.active = true;
  }

  ensureId(data, request) {
    if (!data.id) data.id = this.idGenerator();
    else this.validateId(data.id, request);
  }

  validateId(id, request) {
    const ulidPattern = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;

    if (!ulidPattern.test(id)) {
      request.error(400, 'id must be a valid 26-character ULID');
    }
  }

  validateUpdate(data, request) {
    // UPDATE is a patch, so validate and enrich only fields supplied by the client.
    if (data.stardustCollected !== undefined) this.normalizeStardust(data);
    if (data.wormholeNavigationSkill !== undefined) this.normalizeSkill(data, request);

    data.updatedAt = this.timestampProvider().toISOString();
  }

  normalizeStardust(data) {
    if (data.stardustCollected == null) data.stardustCollected = 0.0;
    data.stardustCollected = Number(data.stardustCollected) || 0.0;
    if (data.stardustCollected < 0) data.stardustCollected = 0.0;
    if (data.stardustCollected < 10.0) data.stardustCollected = 10.0;
  }

  normalizeSkill(data, request) {

    if (
      request.data.wormholeNavigationSkill !== undefined
      && (request.data.wormholeNavigationSkill < 0 || request.data.wormholeNavigationSkill > 100)
    ) {
      request.error(400, 'wormholeNavigationSkill must be between 0 and 100');
    }

    if (data.wormholeNavigationSkill == null) data.wormholeNavigationSkill = 50;
    data.wormholeNavigationSkill = Math.max(
      0,
      Math.min(100, Math.round(Number(data.wormholeNavigationSkill) || 0)),
    );
  }
}

class SpacefarerCreateHandler {
  constructor({ rules, tenantAccessPolicy }) {
    this.rules = rules;
    this.tenantAccessPolicy = tenantAccessPolicy;
  }

  handle(request) {
    const data = request.data || {};
    const identity = new IdentityContext(request.user || request.identity);

    this.rules.enrich(data, request);

    if (identity.userId) data.createdBy = { id: identity.userId };
    this.tenantAccessPolicy.authorizeCreate(data, identity, request);

    getLogger(request).debug(`Creating Spacefarer id=${data.id} planet=${data.planet?.id}`);
  }
}

class SpacefarerUpdateHandler {
  constructor({ rules }) {
    this.rules = rules;
  }

  handle(request) {
    this.rules.validateUpdate(request.data || {}, request);
  }
}

class ConsoleWelcomeEmailSender {
  send({ recipientName, recipientEmail }) {
    console.log(`Sending welcome email to ${recipientName} <${recipientEmail}>`);
  }
}

class WelcomeEmailNotificationHandler {
  constructor({ emailSender }) {
    this.emailSender = emailSender;
  }

  handle(spacefarer, request) {
    const recipientName = [spacefarer.firstName, spacefarer.lastName]
      .filter(Boolean)
      .join(' ');

    this.emailSender.send({
      recipientName,
      recipientEmail: spacefarer.email,
    });

    request.notify({
      code: 'WELCOME_EMAIL_SENT',
      message: `Welcome email sent to ${spacefarer.email}`,
      target: 'email',
    });
  }
}

module.exports = cds.service.impl(function () {
  const tenantAccessPolicy = new TenantAccessPolicy();
  const rules = new SpacefarerRules();
  const welcomeEmailSender = new ConsoleWelcomeEmailSender();

  // Coordinates everything that must happen before a Spacefarer is created
  const createHandler = new SpacefarerCreateHandler({
    rules,
    tenantAccessPolicy,
  });
  const updateHandler = new SpacefarerUpdateHandler({ rules });
  const welcomeEmailNotificationHandler = new WelcomeEmailNotificationHandler({
    emailSender: welcomeEmailSender,
  });

  this.before('CREATE', '*', (request) => {
    if (request.target.isDraft && request.target.actives?.name === 'GalacticService.Spacefarers') {
      rules.ensureId(request.data, request);
    }
  });

  this.before('CREATE', 'Spacefarers', (request) => {
    createHandler.handle(request);
  });

  this.before('UPDATE', 'Spacefarers', (request) => {
    updateHandler.handle(request);
  });

  this.after('CREATE', 'Spacefarers', (_result, request) => {
    welcomeEmailNotificationHandler.handle(request.data, request);
  });

  this.before(['READ', 'UPDATE', 'DELETE'], 'Spacefarers', (request) => {
    const identity = new IdentityContext(request.user || request.identity);
    tenantAccessPolicy.authorizeAccess(identity, request);
  });
});

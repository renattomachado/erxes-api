import * as toBeType from 'jest-tobetype';
import { messengerAppFactory } from '../db/factories';
import { MessengerApps, Users } from '../db/models';

import './setup.ts';

expect.extend(toBeType);

describe('Messenger apps', () => {
  afterEach(async () => {
    await Users.deleteMany({});
    await MessengerApps.deleteMany({});
  });

  test('Get messenger app', async () => {
    const messengerApp = await messengerAppFactory({});

    try {
      await MessengerApps.getApp('fakeId');
    } catch (e) {
      expect(e.message).toBe('Messenger app not found');
    }

    const response = await MessengerApps.getApp(messengerApp._id);

    expect(response).toBeDefined();
  });

  test('Create messenger app', async () => {
    const app = await MessengerApps.createApp({
      kind: 'googleMeet',
      name: 'name',
    });

    expect(app._id).toBeDefined();
    expect(app.kind).toBe('googleMeet');
    expect(app.name).toBe('name');
  });
});
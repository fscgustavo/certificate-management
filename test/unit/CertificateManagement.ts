import { networkConfig, developmentChains } from '../../helper-hardhat.config';
import { expect } from 'chai';
import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { CertificateManagement } from '../../typechain-types';

!developmentChains.has(network.name)
  ? describe.skip
  : describe('AccessControl Unit tests', () => {
      let accounts: Record<string, string>;
      let certificateManagement: CertificateManagement;

      beforeEach(async () => {
        const namedAccounts = await getNamedAccounts();

        accounts = namedAccounts;

        await deployments.fixture('all');

        certificateManagement = await ethers.getContract(
          'CertificateManagement',
          namedAccounts.deployer,
        );
      });

      it('was deployed', async () => {
        expect(certificateManagement.address).to.be.a('string');
      });

      it('deployer should have the organization role', async () => {
        const organizationRole =
          await certificateManagement.ORGANIZATION_ROLE();

        const isOrganization = await certificateManagement.hasRole(
          organizationRole,
          accounts.deployer,
        );

        expect(isOrganization).to.be.equal(true);
      });

      it('deployer should have the organization role', async () => {
        const organizationRole =
          await certificateManagement.ORGANIZATION_ROLE();

        const isOrganization = await certificateManagement.hasRole(
          organizationRole,
          accounts.deployer,
        );

        expect(isOrganization).to.be.equal(true);
      });

      it.skip('should be able to add an university', async () => {
        const organizationRole =
          await certificateManagement.ORGANIZATION_ROLE();

        const isOrganization = await certificateManagement.hasRole(
          organizationRole,
          accounts.deployer,
        );

        expect(isOrganization).to.be.equal(true);
      });
    });

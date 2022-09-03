import { developmentChains } from '../../helper-hardhat.config';
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

        expect(isOrganization).to.equal(true);
      });

      it('deployer should have the organization role', async () => {
        const organizationRole =
          await certificateManagement.ORGANIZATION_ROLE();

        const isOrganization = await certificateManagement.hasRole(
          organizationRole,
          accounts.deployer,
        );

        expect(isOrganization).to.equal(true);
      });

      it('should be able to add an university', async () => {
        const universityRole = await certificateManagement.UNIVERSITY_ROLE();

        await certificateManagement.addUniversity(accounts.university);

        const hasUniversityRole = await certificateManagement.hasRole(
          universityRole,
          accounts.university,
        );

        expect(hasUniversityRole).to.equal(true);
      });

      it('should be able to remove an university', async () => {
        const universityRole = await certificateManagement.UNIVERSITY_ROLE();

        await certificateManagement.removeUniversity(accounts.university);

        const hasUniversityRole = await certificateManagement.hasRole(
          universityRole,
          accounts.university,
        );

        expect(hasUniversityRole).to.equal(false);
      });

      describe('Certifier Management', () => {
        let universityConnection: CertificateManagement;

        beforeEach(async () => {
          await certificateManagement.addUniversity(accounts.university);

          universityConnection = await ethers.getContract(
            'CertificateManagement',
            accounts.university,
          );

          await universityConnection.addCertifier(accounts.certifier);
        });

        it('should be able to add a certifier', async () => {
          const certifierRole = await certificateManagement.CERTIFIER_ROLE();

          const hasCertifierRole = await certificateManagement.hasRole(
            certifierRole,
            accounts.certifier,
          );

          expect(hasCertifierRole).to.equal(true);
        });

        it('the certifier should have infinite allowance from his university', async () => {
          const MAX_ALLOWANCE = await certificateManagement.MAX_ALLOWANCE();

          const certifierAllowance = await certificateManagement.allowance(
            accounts.university,
            accounts.certifier,
          );

          expect(certifierAllowance).to.equal(MAX_ALLOWANCE);
        });

        it('should be able to remove a certifier', async () => {
          const certifierRole = await certificateManagement.CERTIFIER_ROLE();

          await universityConnection.removeCertifier(accounts.certifier);

          const hasCertifierRole = await certificateManagement.hasRole(
            certifierRole,
            accounts.certifier,
          );

          expect(hasCertifierRole).to.equal(false);
        });

        it('should zero the ex-certifier allowance', async () => {
          await universityConnection.removeCertifier(accounts.certifier);

          const certifierAllowance = await certificateManagement.allowance(
            accounts.university,
            accounts.certifier,
          );

          expect(certifierAllowance).to.equal(0);
        });
      });
    });

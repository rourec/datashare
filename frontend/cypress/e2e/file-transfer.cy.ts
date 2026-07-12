describe('Transfert de fichier DataShare', () => {
  const email = `cypress-file-${Date.now()}@datashare.fr`;
  const password = 'Password123';
  const filename = `cypress-${Date.now()}.txt`;
  const fileContent = 'Contenu du fichier de test DataShare';

  let token = '';

  before(() => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/auth/register',
      body: {
        firstname: 'DataShare',
        lastname: 'User',
        email,
        password
      }
    }).its('status').should('eq', 201);

    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/auth/login',
      body: {
        email,
        password
      }
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.token).to.be.a('string');

      token = response.body.token;
    });
  });

  it('téléverse, consulte, télécharge puis supprime un fichier', () => {
    cy.intercept(
      'POST',
      'http://localhost:8080/api/files/upload'
    ).as('uploadRequest');

    cy.visit('/upload', {
      onBeforeLoad(window) {
        window.localStorage.setItem('token', token);
      }
    });

    cy.get('[data-cy="file-input"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContent),
        fileName: filename,
        mimeType: 'text/plain'
      },
      {
        force: true
      }
    );

    cy.get('[data-cy="expiration-days"]')
      .select('3 jours');

    cy.get('[data-cy="upload-submit"]')
      .click();

    cy.wait('@uploadRequest').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body?.originalFilename).to.eq(filename);
      expect(response?.body?.downloadToken).to.be.a('string');

      const downloadToken = response?.body?.downloadToken as string;

      cy.url().should('include', '/upload-success');
      cy.contains(filename).should('be.visible');
      cy.contains('pendant 3 jours').should('be.visible');

      /*
       * Vérification de la page publique sans authentification.
       */
      cy.clearLocalStorage();

      cy.intercept(
        'GET',
        `http://datashare.fr:8080/api/download/${downloadToken}/metadata`
      ).as('metadataRequest');

      cy.visit(`/download/${downloadToken}`);

      cy.wait('@metadataRequest').then(({ response: metadataResponse }) => {
        expect(metadataResponse?.statusCode).to.eq(200);
        expect(metadataResponse?.body?.originalFilename).to.eq(filename);
      });

      cy.contains(filename, { timeout: 10000 })
        .should('be.visible');

      cy.contains('Télécharger')
        .should('be.visible');

      /*
       * Vérification HTTP du contenu réellement téléchargé.
       */
      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/download/${downloadToken}`,
        encoding: 'binary'
      }).then(downloadResponse => {
        expect(downloadResponse.status).to.eq(200);

        expect(
          downloadResponse.headers['content-disposition']
        ).to.contain(filename);

        expect(downloadResponse.body).to.contain(fileContent);
      });

      /*
       * Retour dans l’espace authentifié.
       */
      cy.visit('/mon-espace', {
        onBeforeLoad(window) {
          window.localStorage.setItem('token', token);
        }
      });

      cy.contains(
        '[data-cy="history-file"]',
        filename
      ).should('be.visible');

      cy.intercept(
        'DELETE',
        'http://localhost:8080/api/files/**'
      ).as('deleteRequest');

      cy.contains(
        '[data-cy="history-file"]',
        filename
      ).within(() => {
        cy.get('[data-cy="delete-file"]').click();
      });

      cy.wait('@deleteRequest').then(({ response: deleteResponse }) => {
        expect([200, 204]).to.include(
          deleteResponse?.statusCode
        );
      });

      cy.contains(
        '[data-cy="history-file"]',
        filename
      ).should('not.exist');

      /*
       * Le lien public doit désormais être inutilisable.
       */
      cy.request({
        method: 'GET',
        url:
          `http://localhost:8080/api/download/${downloadToken}/metadata`,
        failOnStatusCode: false
      }).then(metadataAfterDelete => {
        expect([403, 404, 410]).to.include(
          metadataAfterDelete.status
        );
      });
    });
  });
});

describe('Authentification DataShare', () => {
  const email = `cypress-${Date.now()}@datashare.fr`;
  const password = 'Password123';

  it('crée un compte puis connecte l’utilisateur', () => {
    cy.intercept('POST', 'http://localhost:8080/api/auth/register')
      .as('registerRequest');

    cy.intercept('POST', 'http://localhost:8080/api/auth/login')
      .as('loginRequest');

    cy.visit('/register');

    cy.get('[data-cy="register-email"]').type(email);
    cy.get('[data-cy="register-password"]').type(password);
    cy.get('[data-cy="register-confirm-password"]').type(password);
    cy.get('[data-cy="register-submit"]').click();

    cy.wait('@registerRequest').then(({ request, response }) => {
      cy.log(`Register status: ${response?.statusCode}`);
      cy.log(`Register body: ${JSON.stringify(response?.body)}`);

      expect(request.body).to.deep.equal({
        firstname: 'DataShare',
        lastname: 'User',
        email,
        password
      });

      expect(response?.statusCode).to.eq(201);
    });

    cy.contains('Compte créé avec succès.')
      .should('be.visible');

    cy.url({ timeout: 5000 })
      .should('include', '/login');

    cy.get('[data-cy="login-email"]').type(email);
    cy.get('[data-cy="login-password"]').type(password);
    cy.get('[data-cy="login-submit"]').click();

    cy.wait('@loginRequest').then(({ response }) => {
      cy.log(`Login status: ${response?.statusCode}`);
      expect(response?.statusCode).to.eq(200);
      expect(response?.body?.token).to.be.a('string');
    });

    cy.url().should('include', '/accueil');

    cy.window().then(window => {
      expect(window.localStorage.getItem('token'))
        .to.be.a('string')
        .and.not.be.empty;
    });
  });
});

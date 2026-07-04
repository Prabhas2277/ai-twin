package com.campus.common.multitenancy;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Aspect to dynamically enable the Hibernate "tenantFilter" on the current
 * database session before any Spring Data JPA Repository query is executed.
 */
@Aspect
@Component
public class TenantFilterAspect {

    private static final Logger logger = LoggerFactory.getLogger(TenantFilterAspect.class);

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Pointcut intercepts all method executions inside any interface implementing
     * org.springframework.data.repository.Repository (Spring Data JPA Repositories).
     */
    @Before("execution(* org.springframework.data.repository.Repository+.*(..))")
    public void enableTenantFilter() {
        try {
            Session session = entityManager.unwrap(Session.class);
            String tenantId = TenantContext.getCurrentTenant();
            if (tenantId != null) {
                Filter filter = session.enableFilter("tenantFilter");
                filter.setParameter("tenantId", tenantId);
                if (logger.isDebugEnabled()) {
                    logger.debug("Successfully enabled Hibernate tenantFilter for tenant: {}", tenantId);
                }
            } else {
                session.disableFilter("tenantFilter");
                if (logger.isDebugEnabled()) {
                    logger.debug("Disabled Hibernate tenantFilter (no tenant in context)");
                }
            }
        } catch (Exception e) {
            logger.error("Failed to configure Hibernate tenantFilter", e);
        }
    }
}

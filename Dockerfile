# Dockerfile - Optimized for pre-built artifacts
# This expects the dist/ folder to already be built by CI

FROM node:18-alpine

# Install only runtime dependencies
RUN apk add --no-cache curl dumb-init && \
    npm install -g serve@14

WORKDIR /app

# Copy pre-built dist folder
COPY dist/ ./dist/

# Verify dist exists
RUN if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then \
        echo "❌ Error: dist/ folder is missing or empty"; \
        exit 1; \
    else \
        echo "✅ dist/ folder found with $(du -sh dist | cut -f1)"; \
    fi

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3003 || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["serve", "-s", "dist", "-l", "3003", "--no-clipboard", "--cors"]